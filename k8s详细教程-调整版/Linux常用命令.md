#### Screen

```powershell
# 安装
[root@master ~]# apt install screen

# 创建新的窗口并命名
[root@master ~]# screen -S name

# 查看当前已存在的窗口
[root@master ~]# screen -ls

# 进入已经存在的窗口
[root@master ~]# screen -r name/threadnum

# 杀死窗口
[root@master ~]# kill -9 threadnum
# 清理死去的窗口
[root@master ~]# screen -wipe
```