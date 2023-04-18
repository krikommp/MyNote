#### 打包操作
```powershell
# 创建虚拟环境
python -m venv .venv

# 安装 setuptools 和 wheel
pip install wheel

# 打包
python setup.py sdist bdist_wheel

# 安装 twine 进行上传
pip install twine

# 下一步之前需要将私库写入到 ~/.pypirc中
cat ~/.pypirc
[distutils]
index-servers = win172

[win172]
repository: http://192.168.8.172:8082/
username: admin
password: 123456

# 上传
twine upload -r win172 .\dist\*
```

#### 下载操作
```powershell
# 直接安装 
pip install -i http://192.168.8.172:8082 bjai --trusted-host 192.168.8.172

# 通过源下载依赖的包
pip install -i http://192.168.8.172:8082 -e . --trusted-host 192.168.8.172

# 查看需要更新的包
pip list --outdated -i http://192.168.8.172:8082 --trusted-host 192.168.8.172
```