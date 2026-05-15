# Cloudflare 部署说明

## 访问入口

- 小红书对外链接使用 `https://www.bringingaitoyou.com/MBTI`
- 根路径 `/`、`/index.html`、`/mbti-test.html`、`/personality-detail.html`、`/personality-types.html` 会返回 404 页面
- 隐藏管理入口是 `/guess.html`

## D1 数据库

1. 在 Cloudflare Dashboard 创建一个 D1 数据库。
2. 在 D1 控制台执行 `database/schema.sql`。
3. 在 Pages 项目的 Settings 中绑定 D1：
   - Binding name: `DB`
   - Database: 选择刚创建的 D1 数据库

## 管理密码

在 Pages 项目的环境变量中新增：

- Name: `ADMIN_PASSWORD`
- Value: 你自己的管理密码

部署后访问 `/guess.html`，输入管理密码即可：

- 生成 50 个 code 并下载 CSV
- 下载全部 code CSV
- 下载测试结果 CSV
- 查询单个 code 是否使用、什么时候使用、对应小红书用户名和 MBTI 结果

## Code 使用规则

- 用户输入小红书用户名和 code 后才可进入测试
- code 只有在测试结果成功提交并跳转到结果页时才会标记为 `used`
- 用户中途退出不会消耗 code
- 每个 code 只能成功提交一次结果
