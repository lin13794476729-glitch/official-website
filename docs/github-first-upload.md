# 第一次把官网上传到 GitHub

当前这个文件夹还不是 GitHub 仓库。第一次需要先把它放到 GitHub，以后 Codex 才能围绕这个仓库帮你改官网、触发自动部署。

## 方案 A：安装 Git 后让 Codex 继续帮你

如果你愿意，先在电脑上安装 Git：

1. 打开这个地址：<https://git-scm.com/download/win>
2. 下载 Windows 版本
3. 一路 Next 安装
4. 安装完以后，关闭并重新打开 Codex
5. 回来告诉 Codex：`Git 装好了，继续帮我上传到 GitHub`

这是最推荐的方式。

## 方案 B：先手动上传到 GitHub

如果暂时不安装 Git，也可以用网页上传。

### 1. 新建仓库

打开 GitHub：

<https://github.com/new>

建议这样填：

```text
Repository name: official-website
Visibility: Private
不要勾选 Add a README file
```

然后点 `Create repository`。

### 2. 上传文件

进入新仓库后，点：

```text
uploading an existing file
```

上传这个项目里的文件。

注意：不要上传这些文件：

```text
codex_temp_server_key_*
*.tar.gz
backend-code-*.tar.gz
review-*.tar.gz
```

也不要把任何私钥、密码、数据库文件传到 GitHub。

### 3. 必须上传这些文件

至少要有：

```text
index.html
index.php
styles.css
script.js
.htaccess
assets/
.gitignore
.github/workflows/deploy.yml
docs/server-setup.md
```

### 4. 设置 GitHub Secrets

上传完成后，按照 `docs/server-setup.md` 里的第三、第四步设置：

```text
LIGHTHOUSE_HOST
LIGHTHOUSE_USER
LIGHTHOUSE_SSH_KEY
```

设置完成后，在 GitHub 里打开：

```text
Actions -> Deploy website -> Run workflow
```

如果运行成功，你的自动部署链路就通了。
