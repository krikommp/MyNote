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

Git更新ignore文件直接修改gitignore是不会生效的，需要先去掉已经托管的文件，修改完成之后再重新添加并提交。
第一步：git rm -r --cached .
去掉已经托管的文件
第二步：修改自己的igonre文件内容
第三步：git add .
git commit -m "clear cached"