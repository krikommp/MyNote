### Hyper-V Machine

#### 1. 安装虚拟机
安装 win10 会出现许可证无效的提示，需要禁用 Dynamic Memory 选项

#### 2. 网络设置
##### 2.1 NAT 模式（主机）
1. 在 Virtual Switch Manager 中创建 New Virtual network switch
2. 选择 Internal
3. 命名，完成创建
4. 打开 Control Plane -> Networkd and Internet -> Network and Sharing Center -> Change adapter settings
5. 选中之前命名的虚拟网卡，点击 Properties
6. 配置 IPv4 选项，改为手动分配，只需要填写 IP address: 192.168.137.1; Subet mask: 255.255.255.0
#### 2.2 NAT 模式（虚拟机）
从上一节步骤4开始
#### 2.3 端口映射
目前可以通过主机内部IP地址来使用远程桌面访问虚拟机，外部网络无法通过主机内部IP地址来访问虚拟机，因此需要将端口映射
1. 查看目前端口映射情况
`netsh interface portproxy show v4tov4`
2. 添加一个新的端口，根据实际情况修改 listenport 和 connectaddress
`netsh interface portproxy add v4tov4 listenport=30001 connectport=3389 connectaddress=192.168.137.176`