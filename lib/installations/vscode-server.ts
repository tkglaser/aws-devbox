import * as path from 'path';

import { chown, runAs } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

const version = '1.78.2';

const configDir = '.openvscode-server';

const extensions = [
  'andys8.jest-snippets',
  'drknoxy.eslint-disable-snippets',
  'dsznajder.es7-react-js-snippets',
  'ecmel.vscode-html-css',
  'editorconfig.editorconfig',
  'folke.vscode-monorepo-workspace',
  'humao.rest-client',
  'johnpapa.vscode-peacock',
  'karyfoundation.nearley',
  'kast789.vs-2019-theme',
  'mariusalchimavicius.json-to-ts',
  'marklel.vscode-brazil',
  'mhutchie.git-graph',
  'mikestead.dotenv',
  'ms-python.isort',
  'ms-toolsai.vscode-jupyter-slideshow',
  'planbcoding.vscode-react-refactor',
  'redhat.fabric8-analytics',
  'redhat.vscode-commons',
  'satokaz.vscode-markdown-header-coloring',
  'wix.glean',
  'dbaeumer.vscode-eslint',
  'christian-kohler.npm-intellisense',
  'jebbs.plantuml',
  'hediet.vscode-drawio',
  'ms-toolsai.jupyter-keymap',
  'golang.go',
  'ms-toolsai.jupyter-renderers',
  'shd101wyy.markdown-preview-enhanced',
  'ms-toolsai.vscode-jupyter-cell-tags',
  'redhat.vscode-yaml',
  'yzhang.markdown-all-in-one',
  'vscjava.vscode-java-test',
  'vscjava.vscode-maven',
  'grapecity.gc-excelviewer',
  'streetsidesoftware.code-spell-checker',
  'meganrogge.template-string-converter',
  'marp-team.marp-vscode',
  'ms-azuretools.vscode-docker',
  'redhat.vscode-xml',
  'esbenp.prettier-vscode',
  'vscjava.vscode-java-dependency',
  'vscjava.vscode-java-pack',
  'vscjava.vscode-java-debug',
  'pkief.material-icon-theme',
  'redhat.java',
  'ms-toolsai.jupyter',
  'ms-python.python',
];

export function vsCodeServer(userData: UserDataBuilder, props: { user: string; ports?: { vsCodeServer?: number } }) {
  const code = `/home/${props.user}/openvscode-server-v${version}-linux-x64/bin/openvscode-server`;
  userData.cmd(
    runAs(
      props.user,
      `wget https://github.com/gitpod-io/openvscode-server/releases/download/openvscode-server-v${version}/openvscode-server-v${version}-linux-x64.tar.gz -O code-server.tar.gz`,
    ),
    runAs(props.user, `tar -xzf code-server.tar.gz`),
    runAs(props.user, `rm code-server.tar.gz`),

    `cat <<EOT >> /etc/systemd/system/vscode-server.service`,
    `[Unit]`,
    `Description=VSCode Server`,
    `DefaultDependencies=no`,
    `After=network.target`,

    `[Service]`,
    `Type=simple`,
    `User=${props.user}`,
    `ExecStart=${code} --without-connection-token --port ${props.ports?.vsCodeServer ?? 3000}`,
    `TimeoutStartSec=0`,
    `RemainAfterExit=yes`,
    ``,
    `[Install]`,
    `WantedBy=default.target`,
    `EOT`,
    ``,

    `systemctl daemon-reload`,
    `systemctl enable vscode-server.service`,
    `systemctl restart vscode-server.service`,

    runAs(props.user, `mkdir -p ~/${configDir}/extensions`),
    runAs(props.user, `touch ~/${configDir}/extensions/extensions.json`),
    ...extensions.map((x) => runAs(props.user, `${code} --install-extension ${x}`)),
  );

  userData.s3Copy(
    path.join(__dirname, 'vscode-server/settings.json'),
    `/home/${props.user}/${configDir}/data/Machine/settings.json`,
  );

  userData.cmd(chown(props.user, `/home/${props.user}/${configDir}/`));
}
