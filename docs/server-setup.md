# 腾讯云轻量服务器自动部署配置说明

这份说明的目标是：

- Codex 以后改官网文件
- GitHub 自动把官网文件发布到腾讯云服务器
- 不给 Codex 或 GitHub root 密码
- 不随便修改后台、数据库、订单数据、商品图片

当前服务器信息：

```text
公网 IP: 82.156.97.56
网站目录: /home/www/htdocs
部署用户: deploy
```

## 第一步：在服务器创建 deploy 用户

打开腾讯云 OrcaTerm，用 root 终端执行：

```bash
adduser --disabled-password --gecos "" deploy
passwd -l deploy
```

查看网站服务是哪个用户在运行：

```bash
ps -eo user,comm | grep -E 'apache|httpd|nginx'
```

如果看到的用户不是 `www-data`，下面命令里的 `www-data` 要替换成你实际看到的用户。

```bash
usermod -aG www-data deploy

mkdir -p /home/www/htdocs
mkdir -p /home/www/backups

chown -R root:www-data /home/www/htdocs
chmod -R g+rwX /home/www/htdocs
find /home/www/htdocs -type d -exec chmod 2775 {} \;

chown -R deploy:deploy /home/www/backups
```

安装部署需要的小工具：

```bash
apt update
apt install -y acl rsync
```

给 `deploy` 用户网站目录权限：

```bash
setfacl -R -m u:deploy:rwx /home/www/htdocs
setfacl -R -d -m u:deploy:rwx /home/www/htdocs
```

如果商品图片目录存在，把它改成只读，避免自动部署误删误改后台图片：

```bash
if [ -d /home/www/htdocs/uploads/goods ]; then
  setfacl -R -m u:deploy:rx /home/www/htdocs/uploads/goods
  setfacl -R -d -m u:deploy:rx /home/www/htdocs/uploads/goods
fi
```

## 第二步：创建 GitHub Actions 专用 SSH key

这一步在你自己的电脑上做，不是在服务器上。

如果你是 Windows，可以打开 PowerShell，执行：

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\lighthouse_github_actions -C "github-actions-deploy"
```

查看公钥：

```powershell
Get-Content $env:USERPROFILE\.ssh\lighthouse_github_actions.pub
```

复制输出的整行内容。

回到服务器 root 终端，把公钥粘到 `deploy` 用户的授权文件里：

```bash
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

在你自己的电脑上测试登录：

```powershell
ssh -i $env:USERPROFILE\.ssh\lighthouse_github_actions deploy@82.156.97.56
```

能登录成功，说明 GitHub 以后也能用这把 key 部署。

## 第三步：把这个文件夹上传到 GitHub

这个项目里我已经加好了：

```text
.github/workflows/deploy.yml
.gitignore
docs/server-setup.md
```

重要提醒：

```text
codex_temp_server_key_*
*.tar.gz
后台目录 admin
接口目录 api
数据目录 data
上传目录 uploads
```

这些都不应该作为官网发布内容上传或覆盖。

如果你还没有 GitHub 仓库，可以在 GitHub 新建一个私有仓库，比如：

```text
official-website
```

然后把当前这个官网文件夹上传进去。

## 第四步：在 GitHub 填三个密钥

打开 GitHub 仓库：

```text
Settings
-> Secrets and variables
-> Actions
-> New repository secret
```

添加第一个：

```text
Name: LIGHTHOUSE_HOST
Secret: 82.156.97.56
```

添加第二个：

```text
Name: LIGHTHOUSE_USER
Secret: deploy
```

添加第三个：

```text
Name: LIGHTHOUSE_SSH_KEY
Secret: 你的私钥完整内容
```

Windows 查看私钥内容：

```powershell
Get-Content $env:USERPROFILE\.ssh\lighthouse_github_actions
```

复制从下面这一行开始到结尾的全部内容：

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

只放到 GitHub Secrets，不要上传到仓库文件里。

## 第五步：触发部署

上传代码到 GitHub 的 `main` 分支后，会自动部署。

也可以手动运行：

```text
GitHub 仓库
-> Actions
-> Deploy website
-> Run workflow
```

自动部署会做这些事：

- 备份 `/home/www/htdocs` 到 `/home/www/backups/htdocs_日期`
- 只发布官网文件
- 不发布 `admin`、`api`、`data`、`uploads`、`config`
- 不发布 SQL 文件、压缩包、服务器私钥
- 部署后在服务器内部访问首页做一次检查

## 第六步：回滚

如果部署后发现页面不对，可以在服务器 root 终端执行：

```bash
ls -lh /home/www/backups
```

找到要恢复的备份目录，然后执行：

```bash
rm -rf /home/www/htdocs
cp -a /home/www/backups/htdocs_YYYYMMDD_HHMMSS /home/www/htdocs
```

把 `htdocs_YYYYMMDD_HHMMSS` 换成真实备份目录名。
