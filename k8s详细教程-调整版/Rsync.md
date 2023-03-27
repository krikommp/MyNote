## Rsync 使用教程

### 1. 安装
```powershell
# ubuntu 默认已经安装
[root@master ~]# sudo apt install -y rsync
```

### 2. 基本参数
#### 2.1 -r 参数
可以使用 `rsync` 代替 `cp` 或者 `mv` 方法同步文件到指定目录
```powershell
[root@master ~]# rsync -r source destination
```
使用 `-r`  参数可以递归子目录
`source` 表示源目录，`destination` 表示目标目录

也可以同步多个源目录到一个目标目录
```powershell
[root@master ~]# rsync -r source1 source2 destination
```

#### 2.2 -a 参数
可以使用 `-a` 参数代替 `-r`， 此参数可以同步文件元信息（例如：时间，权限）
```powershell
[root@master ~]# rsync -a source destination
```
若 `destination` 目录不存在，那么 `rsync` 将会自动创建一个目录
注意该命令产生的效果是：在 destination 目录下面复制一个 source 目录，即 destination/source 结构
如果想要将 source 目录下的内容复制而不是 source 目录本身，可以使用如下命令
```powershell
[root@master ~]# rsync -a source/ destination
```
#### 2.3 -n 参数
该参数可以用于模拟命令结果，`-v` 参数用于输出结果
```powershell
[root@master ~]# rsync -anv source/ destination
```

#### 2.4 -delete 参数
默认情况下，`rsync` 指令只会将源目录中除去明确排除的文件复制到目标目录，不会保证目标目录中其他文件是否存在，所以如果
需要将目录目录中所有文件与源目录中保持一致，可以使用 `-delete` 参数自动删除目标目录中多余的文件
```powershell
[root@master ~]# rsync -av -delete source/ destination
```
此时 `destination` 和 `source` 将完全一致

#### 2.5 --exclude 参数
在同步过程中如果希望将指定某些文件或文件排除，可以使用 `--excluede` 参数
```powershell
# 排除所有 .txt 结尾的文件
[root@master ~]# rsync -av --exclude='*.txt' source/ destination

# 排除所有隐藏文件
[root@master ~]# rsync -av --exclude='.*' source/ destination

# 排除指定目录下的所有文件但不排除目录
[root@master ~]# rsync -av --exclude='dir1/*' source/ destination

# 排除多个文件
[root@master ~]# rsync -av --exclude='*.txt' --exclude='.*' --exclude='dir1/*' source/ destination

# 也可以将需要排除的文件写入到一个文件中，一行一个
[root@master ~]# rsync -av --exclude-from="exclude-file.txt" source/ destination
```

#### 2.6 其他参数
可以参考如下
```powershell
-v, --verbose         #详细模式输出
-q, --quiet           #精简输出模式
-c, --checksum        #打开校验开关，强制对文件传输进行校验
-a, --archive         #归档模式，表示以递归方式传输文件，并保持所有文件属性，等于-rlptgoD
-r, --recursive       #对子目录以递归模式处理
-R, --relative        #使用相对路径信息
-b, --backup          #创建备份，也就是对于目的已经存在有同样的文件名时，将老的文件重新命名为~filename。可以使用--suffix选项来指定不同的备份文件前缀。
--backup-dir          #将备份文件(如~filename)存放在在目录下。
-suffix=SUFFIX        #定义备份文件前缀
-u, --update          #仅仅进行更新，也就是跳过所有已经存在于DST，并且文件时间晚于要备份的文件。(不覆盖更新的文件)
-l, --links           #保留软链结
-L, --copy-links      #像对待常规文件一样处理软链接
--copy-unsafe-links   #仅仅拷贝指向SRC路径目录树以外的链接
--safe-links          #忽略指向SRC路径目录树以外的链接
-H, --hard-links      #保留硬链接
-p, --perms           #保持文件权限
-o, --owner           #保持文件属主信息
-g, --group           #保持文件属组信息
-D, --devices         #保持设备文件信息
-t, --times           #保持文件时间信息
-S, --sparse          #对稀疏文件进行特殊处理以节省DST的空间
-n, --dry-run         #显示哪些文件将被传输
-W, --whole-file      #拷贝文件，不进行增量检测
-x, --one-file-system #不要跨越文件系统边界
-B, --block-size=SIZE #检验算法使用的块尺寸，默认是700字节
-e, --rsh=COMMAND     #指定使用rsh、ssh方式进行数据同步
--rsync-path=PATH     #指定远程服务器上的rsync命令所在路径信息
-C, --cvs-exclude     #使用和CVS一样的方法自动忽略文件，用来排除那些不希望传输的文件
--existing            #仅仅更新那些已经存在于DST的文件，而不备份那些新创建的文件
--delete              #删除那些DST中SRC没有的文件
--delete-excluded     #同样删除接收端那些被该选项指定排除的文件
--delete-after        #传输结束以后再删除
--ignore-errors       #即使出现IO错误也进行删除
--max-delete=NUM      #最多删除NUM个文件
--partial             #保留那些因故没有完全传输的文件，以是加快随后的再次传输
--force               #强制删除目录，即使不为空
--numeric-ids         #不将数字的用户和组ID匹配为用户名和组名
--timeout=TIME        #IP超时时间，单位为秒
-I, --ignore-times    #不跳过那些有同样的时间和长度的文件
--size-only           #当决定是否要备份文件时，仅仅察看文件大小而不考虑文件时间
--modify-window=NUM   #决定文件是否时间相同时使用的时间戳窗口，默认为0
-T --temp-dir=DIR     #在DIR中创建临时文件
--compare-dest=DIR    #同样比较DIR中的文件来决定是否需要备份
-P                    #等同于 --partial
--progress            #显示备份过程
-z, --compress        #对备份的文件在传输时进行压缩处理
--exclude=PATTERN     #指定排除不需要传输的文件模式
--include=PATTERN     #指定不排除而需要传输的文件模式
--exclude-from=FILE   #排除FILE中指定模式的文件
--include-from=FILE   #不排除FILE指定模式匹配的文件
--version             #打印版本信息
--address             #绑定到特定的地址
--config=FILE         #指定其他的配置文件，不使用默认的rsyncd.conf文件
--port=PORT           #指定其他的rsync服务端口
--blocking-io         #对远程shell使用阻塞IO
-stats                #给出某些文件的传输状态
--progress            #在传输时显示传输过程
--log-format=formAT   #指定日志文件格式
--password-file=FILE  #从FILE中得到密码
--bwlimit=KBPS        #限制I/O带宽，KBytes per second
-h, --help            #显示帮助信息
```

### 3. 同步模式
> rsync 同步模式有三种
> 1. 本地模式
> 2. 通过 ssh 访问
> 3. 守护进程模式
#### 3.1 本地同步
直接使用命令执行，在本机不同目录之间进行同步，不需要额外配置
```powershell
[root@mastr ~]# rsync [OPTIONS...] SRC... [DEST]
```

#### 3.2 ssh 同步
可以配置ssh密钥进行免密操作
```powershell
# pull
[root@master ~]# rsync [OPTION…] [USER@]HOST:SRC… [DEST]

# push
[root@master ~]# rsync [OPTION…] SRC… [USER@]HOST:DEST
```

#### 3.3 守护进程方式
另一种异地同步方式
配置较为繁琐，功能强大
##### 3.3.1 配置步骤
> 服务器配置
1. 在 `/etc/rsyncd` 目录下创建 `rsyncd.conf` 文件
```powershell
# rsyncd.conf 配置文件说明
uid = root          # 设置 rsync 运行权限为 root
gid = root          # 设置 rsync 运行权限为 root
use chroot = no     # 默认为true，修改为no，增加对目录文件软连接的备份
max connections = 5 # 最大连接数，0 为不设限制
strict mode = yes   # 验证密钥文件权限
port = 873          # 默认端口
pid file = /var/run/rsyncd.pid      # pid 文件存放位置
lock file = /var/run/rsyncd.lock    # 支持max connections参数的锁文件
log file = /var/log/rsyncd.log      # 日志文件存放位置，自动创建
secrets file = /etc/rsyncd/rsyncd.secrets   # 用户认证配置文件，保存用户名及密码，需要手动创建

[backup]            # 自定义同步模块名，可以自己指定，也可以写多个
path = /demo/       # 服务器数据存放位置，客户端将数据同步到此处
comment = This is a backup
ignore errors       # 忽略出现的错误
read only = yes     # 禁止客户端对数据写入
list = no           # 不显示服务器资源目录
hosts allow = 192.168.145.101   # 允许同步的客户端ip地址，如果有多个用逗号隔开
hosts deny = 192.168.145.102    # 不允许进行同步的ip地址，如果有多个用逗号隔开
auth users = test   # 执行同步的用户名，如果有多个的话同逗号隔开
```
> hosts allow 和 hosts deny
> - 两个参数都没有的时候，那么所有用户都可以任意访问
> - 只有allow，那么仅仅允许白名单中的用户可以访问模块
> - 只有deny，那么仅仅黑名单中的用户禁止访问模块
> - 两个参数都存在，后优先检查白名单
> - 如果匹配成功，则允许访问
> - 如果匹配失败，就去检查黑名单，如果匹配成功则禁止访问
> - 如果都没有匹配成功，则允许访问

2. 在 `/etc/rsyncd` 目录下创建 `rsyncd.secrets` 文件
```powershell
# 格式如下
[root@master ~] sudo vim /etc/rsyncd/rsyncd.secrets
test:123456 # 对应于 auth users 中填写的用户名，后面是密码

# 修改权限
[root@master ~] sudo chmod 600 /etc/rsyncd/rsyncd.secrets
```

3. 启动 `rsync daemon` 
```powershell
# 启动前先创建目录
[root@master ~]# mkdir /demo

# 启动
[root@master ~]# sudo rsync --daemon --config=/etc/rsyncd/rsyncd.conf

# 关闭
[root@master ~]# sudo pkill rsync

# 查看端口是否开启
[root@master ~]# ss -anl | grep 873
tcp   LISTEN 0      5                                                                                 0.0.0.0:873              0.0.0.0:*          
tcp   LISTEN 0      5                                                                                    [::]:873                 [::]:*   
```
> 客户端配置
1. 创建密码文件
```powershell
# 写入，要与将要同步的用户名对应
[root@master ~]# sudo echo "123456" > /etc/rsyncd.secrets

# 修改权限
[root@master ~]# sudo chmod 600 /etc/rsyncd.secrets
```

2. 开启同步
```powershell
[root@master ~]# sudo rsync -avzP --port 873 --delete --progress test@192.168.145.100::backup --password-file=/etc/rsyncd.secrets /usr/backup
```

3. 客户端定时同步  
```powershell
# 使用 crontab 完成

[root@master ~]# crontab -e
# 或者
[root@master ~]# sudo vim /etc/crontab

# 加入上面的指令以及希望执行同步的时间，这里以每分钟同步一次为例

# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

SHELL=/bin/sh
# You can also override PATH, but by default, newer versions inherit it from the environment
#PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name command to be executed
*  *    * * *   root    rsync -avzP --port 873 --delete --progress test@192.168.145.100::backup --password-file=/etc/rsyncd.secrets /usr/backup

# 生效
[root@master ~]# crontab /etc/crontab
[root@master ~]# sudo systemctl restart cron.service

# 等待一分钟后查看效果
[root@master ~]# ls /usr/backup
```

