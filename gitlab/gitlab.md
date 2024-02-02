# gitlab 使用教程

## 1. 使用 docker 创建 gitlab 镜像

```dockerfile
  gitlab:
    image: gitlab/gitlab-ce
    restart: always
    profiles:
      - git
      - all
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'http://tech.ai.blackjack-local.com:5070'
        gitlab_rails['gitlab_shell_ssh_port'] = 5071
    ports:
      - '5070:5070'
      - '5071:22'
    volumes:
      - ./storage/gitlab/config:/etc/gitlab
      - ./storage/gitlab/logs:/var/log/gitlab
      - ./storage/gitlab/data:/var/opt/gitlab
    shm_size: '256m'
```

## 2. 使用 docker-compose 启动 gitlab

```bash
docker-compose --profile git up -d
```

## 3. 修改 gitlab ssh 端口

在第一步中使用 `gitlab_rails['gitlab_shell_ssh_port'] = 5071` 修改了 ssh 端口，但是在 gitlab 中还需要修改一下 ssh 端口，不然还是无法生效

```bash
vim /asserts/sshd_config

# 修改 Port 22 为 Port 5071

# 重启 sshd 服务
service sshd restart
```

## 4. 创建 root 用户

```bash

gitlab-rails console -e production
user = User.where(id: 1).first
user.password = 'secret_pass'
user.password_confirmation = 'secret_pass'
user.save!
exit
exit

```

完成后重启服务

