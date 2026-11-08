# MomoAI for DeepSeek Harness

MomoAI 独立接入插件，支持账户注册、模型与协议选择、扫码充值、按量购买 Token、余额与用量展示。适用于 DSH 桌面版 **0.2.2-rc.1**。

## 下载安装

当前版本 **0.1.11（预览版）**。已验证环境：macOS arm64、DSH **0.2.2-rc.1**。其他系统和 DSH 版本尚未验收。

### 方式一：安装预构建包（推荐）

1. 安装并启动过 DeepSeek Harness，然后退出应用。
2. 从 [v0.1.11 下载页](https://github.com/SushangLi/momoai_harness_plugin/releases/tag/v0.1.11) 下载 **`dsh-plugin-momoai-0.1.11.tgz`** 和 **`install.command`**，放在同一个文件夹。
3. 在终端进入该文件夹并运行安装脚本。例如都下载到了「下载」目录：

   ```sh
   cd ~/Downloads
   sh ./install.command
   ```

   脚本使用 DSH 自带的 CLI 安装到 `desktop` profile。无需编译，也无需另装 Node.js；首次安装需要联网下载依赖。

4. 重新打开 DSH。侧栏会出现 **MomoAI** 卡片；也可以在设置中打开 **「MomoAI 账户与余额」**。

也可不使用脚本，直接运行以下命令（替换成实际下载路径）：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add "$HOME/Downloads/dsh-plugin-momoai-0.1.11.tgz"
```

安装包的 SHA-256 文件一并放在下载页，可在同一目录运行 `shasum -a 256 -c dsh-plugin-momoai-0.1.11.tgz.sha256` 校验。

### 方式二：在桌面插件管理器导入本地目录

1. 克隆本仓库，或在 GitHub 点击 **Code → Download ZIP** 后解压。仓库已包含预构建的 `lib/` 文件。
2. 打开 DSH 的 **插件 → 添加方式菜单 → 安装第三方插件 → 本地目录**。
3. 选择仓库中的 **`deepseek_harness` 子目录**，不要选择仓库根目录。该子目录中应能看到 `package.json` 和 `cordis.patch.yml`。
4. 安装后重启 DSH。如果桌面安装入口不可用，使用上面的 CLI 方式。

本项目没有发布到 npm；不要使用 `npm install dsh-plugin-momoai`，也不要直接把此仓库根地址当作单个 DSH 插件导入。

## 首次使用

1. **注册账户**：点击侧栏「连接 MomoAI」，填写昵称，阅读并勾选用户协议，再点击「注册」。只有提交后才会开户；凭据由 DSH 宿主保存。
2. **选择模型**：默认是 `momo_247`（DeepSeek-V4-Flash）。模型框下可勾选「推荐 / 持有 / 全部」，默认显示推荐与持有模型的并集，支持搜索并记住筛选。推荐名单与平台同步，调用类型默认自动适配。手动偏好不兼容时自动切换，切回兼容模型时恢复偏好。
3. **充值积分**：填写人民币金额，选择微信或支付宝，点击「立即充值」。微信在插件中展示二维码；支付宝打开官方收银台。付款由本人完成。
4. **刷新积分**：付款后点击「刷新积分」或订单行的「刷新」。刷新后可在账户概览查看积分余额。
5. **购买 Token**：在「按量购买 Token」填写数量，查看报价，核对目标模型、预计支出及最高授权支出后点击「确认购买」。**充值不会自动购买 Token**。
6. **开始使用**：回到 DSH，选择或创建可用工作区并新建会话，在模型选择器中确认使用 MomoAI 模型。持有该模型 Token 后即可发起调用。
7. **查看用量 / 卖出**：「用量与账户」显示本机会话统计；「卖出多余余额」在系统浏览器打开当前模型详情页，网站登录及交易由本人完成。

如果 DSH 首次欢迎页要求官方 DeepSeek Key，可选择 **「添加 API Key → 稍后配置」**，再进入插件注册。

## 更新、禁用与卸载

- 更新：退出 DSH，安装新版本 `.tgz`，再启动应用。已有账户和本地记录会保留。
- 禁用 / 卸载：在 DSH 插件管理器中操作。如果默认模型仍指向 MomoAI，请在原生模型设置中重新选择其他 provider。
- 卸载不会删除 MomoAI 账户、DSH 中保存的凭据和本地交易记录；需要迁移时，先在「用量与账户 → 查看账户信息」保存登录信息。

## 模型与调用类型

默认模型为 `momo_247`（DeepSeek-V4-Flash），调用类型默认为「自动」。

| 模型平台格式 | 自动使用的调用类型 |
| --- | --- |
| OpenAI | OpenAI Chat Completions |
| Anthropic | Anthropic Messages |
| Google | OpenAI Chat Completions（平台转换） |

可以手动选择调用类型。切换到不兼容模型时，插件自动调整实际类型；切回兼容模型后恢复偏好。

## 开发与打包

在本目录执行（Node.js 24+）：

```sh
npm ci --ignore-scripts
npm test
npm pack
```

- `src/`：TypeScript 源码。
- `lib/index.js`：宿主模块。
- `lib/client.js`：客户端界面。
- `lib/typert.js`：RPC 元数据。
- `cordis.patch.yml`：DSH bundle 注册。
- `tests/`：协议、账户和交易流程测试。

构建使用 DSH 的公开插件扩展接口，不修改应用包或服务端。
