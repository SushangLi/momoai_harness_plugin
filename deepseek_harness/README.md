# MomoAI for DeepSeek Harness

MomoAI 独立接入插件，支持账户注册、模型与协议选择、扫码充值、按量购买 Token、余额与用量展示。适用于 DSH 桌面版 **0.2.2-rc.1**。

## 安装

适用于 **DSH 桌面版 0.2.2-rc.1**，已在 macOS arm64 验证。

1. 打开 DSH → **插件 → 添加插件**。
2. 在「包名或地址」中粘贴：

   ```text
   https://github.com/SushangLi/momoai_harness_plugin
   ```

3. 点击 **安装**，完成后按提示启用并重启 DSH。

无需下载文件、运行脚本或手动编译。仓库入口随发布版本更新，以后分享同一地址即可。安装不会自动注册 MomoAI 账户。

<details>
<summary>命令行与离线安装</summary>

已安装 `dsh` 命令时：

```sh
dsh plugin --profile desktop add https://github.com/SushangLi/momoai_harness_plugin
```

macOS 桌面版也可以使用随附的 CLI：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add https://github.com/SushangLi/momoai_harness_plugin
```

离线包和安装脚本保留在 [Releases](https://github.com/SushangLi/momoai_harness_plugin/releases)。需要固定版本时，可下载对应 `.tgz`，在插件安装框填写其本地绝对路径。脚本方式则将 `.tgz` 与 `install.command` 放在同一目录，退出 DSH 后运行 `sh ./install.command`。

开发者也可导入本地 `deepseek_harness` 子目录。项目尚未发布到 npm。

</details>

## 首次使用

1. **注册账户**：点击侧栏「连接 MomoAI」，填写可重复的昵称、邮箱和密码（至少 12 个字符），勾选用户协议并提交。账号名自动生成，完成邮件验证后选择「登录」。已有账号可明确选择用户名或邮箱登录；密码仅用于当次请求，宿主长期只保存 API Key。
2. **选择模型**：默认是 `momo_247`（DeepSeek-V4-Flash）。模型框下可勾选「推荐 / 持有 / 全部」，默认显示推荐与持有模型的并集，支持搜索并记住筛选。推荐名单与平台同步，调用类型默认自动适配。手动偏好不兼容时自动切换，切回兼容模型时恢复偏好。
3. **充值积分**：填写人民币金额，选择微信或支付宝，点击「立即充值」。微信在插件中展示二维码；支付宝打开官方收银台。付款由本人完成。
4. **刷新积分**：付款后点击「刷新积分」或订单行的「刷新」。刷新后可在账户概览查看积分余额。
5. **购买 Token**：在「按量购买 Token」填写数量，查看报价，核对目标模型、预计支出及最高授权支出后点击「确认购买」。**充值不会自动购买 Token**。
6. **开始使用**：回到 DSH，选择或创建可用工作区并新建会话，在模型选择器中确认使用 MomoAI 模型。持有该模型 Token 后即可发起调用。
7. **查看用量 / 卖出**：「用量与账户」显示本机会话统计；「卖出多余余额」在系统浏览器打开当前模型详情页，网站登录及交易由本人完成。

如果 DSH 首次欢迎页要求官方 DeepSeek Key，可选择 **「添加 API Key → 稍后配置」**，再进入插件注册。

## 更新、禁用与卸载

- 更新：按 DSH 的提示卸载后重新添加同一仓库地址，安装完成后重启。已有账户和本地记录会保留。
- 禁用 / 卸载：在 DSH 插件管理器中操作。如果默认模型仍指向 MomoAI，请在原生模型设置中重新选择其他 provider。
- 卸载不会删除 MomoAI 账户、DSH 中保存的凭据和本地交易记录；需要迁移时，先在「用量与账户 → 查看账户信息」保存账号 ID、账号名和 API Key。

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

## 统一身份升级（0.1.13）

昵称只用于展示，订单和用量归属使用不可变的 `userId`。旧账户先用原有凭据向平台确认身份，再迁移本地记录并去除旧密码、旧登录令牌；未能确认的记录保留原样，不按昵称猜测归属。原 API Key 不重置。

注册结果不明时保留待确认状态，不自动再次开户。购买结果不明时继续待核对，不自动重试。HTTP 错误优先显示服务端的 `message`、`error` 或 `error.message`；只有缺少消息时才显示状态码。
