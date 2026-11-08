#!/bin/sh
set -eu
plugin_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
dsh_cli='/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh'
if [ ! -x "$dsh_cli" ]; then
  printf '%s\n' '请先安装 DeepSeek Harness 桌面版 0.2.2-rc.1。' >&2
  exit 1
fi
bundle="$plugin_dir/dsh-plugin-momoai-0.1.11.tgz"
if [ ! -f "$bundle" ]; then
  printf '%s\n' '缺少本地安装包，请先执行 npm ci、npm test、npm pack。' >&2
  exit 1
fi
"$dsh_cli" plugin --profile desktop add "$bundle"
printf '%s\n' '安装完成。请重启 DSH，在设置中打开“MomoAI 账户与余额”。'
