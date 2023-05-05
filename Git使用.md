GridAIPawnData

// 重新拉取所有分支信息
git remote update origin --prune

// 查看修改
git status

// 丢弃该文件本地修改
git checkout -- filename

// 丢弃本地所有修改
git checkout .

// 查看文件权限
git ls-files --stage

// 修改文件权限
git update-index --chmod=+x filename