## Poetry 使用教程

### 1. 安装

#### Linux, Windows(WSL), Macos  
`curl -sSL https://install.python-poetry.org | python3 -`

如果需要指定安装位置
可以通过设置 `POETRY_HOME` 参数来指定安装位置
`curl -sSL https://install.python-poetry.org | POETRY_HOME=/etc/poetry python3 -`

#### Windows(Powershell)
`(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -`


#### 安装位置  
位于各平台不同的 `poetry` 文件夹中

- `~/Library/Application Support/pypoetry/venv/bin/poetry` on MacOS.
- `~/.local/share/pypoetry/venv/bin/poetry` on Linux/Unix.
- `%APPDATA%\pypoetry\venv\Scripts\poetry` on Windows.
- `$POETRY_HOME/venv/bin/poetry` if $POETRY_HOME is set.

#### 检查安装状态

`poetry --version` 查看安装版本

`poetry self update --preview` 更新到 pre 版本

`poetry self update 1.2.0` 更新到指定版本

### 2. 基本使用

#### 2.1 项目设置

创建新项目，并命名为 poetry-demo-1

`poetry new poetry-demo-1`

项目结构如下
```powershell
new poetry-demo-1
├── pyproject.toml
├── README.md
├── new poetry-demo-1
│   └── __init__.py
└── tests
    └── __init__.py
```

### 3. 设置仓库地址

#### 3.1 设置私有仓库下载

默认从 PyPI 仓库下载，接下来配置一个私有仓库来从这个仓库中下载需要的 packages

首先配置一个新的仓库地址作为 secondary package source  
`poetry source add --secondary win172 http://192.168.8.172:8081`

如果该仓库需要密码访问，配置用户

`poetry config http-basic.win172 admin 123456`

然后就可以从该仓库中拉取所需要的 package

`poetry add --source win172 demo`

此时也自动会在 `pyproject.toml` 文件中添加 `demo` 依赖

```toml
[tool.poetry.dependencies]
python = "^3.10"
demo = {version = "^0.0.6", source = "win172"}
```

> 提示：  
> 可能在拉取过程中会发生 **RuntimeError**, 具体报错如下：  
> `Retrieved digest for link demo-0.0.6.tar.gz(md5:7c7ad184c2fe67ef7928dcd984a68955) not in poetry.lock metadata {'sha256:3ea90d5a782a7f8bd75d12f637e5f39d5113294e5c4a1e914ee6724ad3d8bb9f'}`  
> 可以使用  
> `poetry config experimental.new-installer false`   
> 修复错误

#### 3.2 设置私有仓库上传

首先需要配置上传仓库地址

`poetry config repositories.win172 http://192.168.8.172:8081`

> 如果仓库上传需要认证，那么有需要配置用户信息  
> `poetry config http-basic.win172 admin 123456`

现在可以进行上传操作  
`poetry publish --build --repository win172`