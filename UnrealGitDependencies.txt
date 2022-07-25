从 Setup.bat 脚本开始
启动参数为
.\Engine\Binaries\DotNET\GitDependencies.exe --prompt

进入 GitDependencies/Program.cs --- Main 函数中
1. 参数解析
	TODO... 暂略

2. UpdateWorkingTree 
	主要逻辑
	1. 读取 .gitdepsignore 文件
	2. 寻找所有的 manifests 文件，将他们加入到字典中
	3. 查找方式
		1. RootPath 在 Setup.bat 文件同级
		因此在调试时注意程序的目录，默认的目录是找不到 .gitdeps.xml 文件的
		需要在 Engine 目录下

		2. 在 Engine 目录下搜索每一个子目录
		对于每一个子目录只找两个文件夹
		build:	会找出所有 *.gitdeps.xml 文件
		Plugins:  在每个 Plugins 文件夹中查找 Build 文件夹
			  查找逻辑与查找 Build 中的一致，找出所有 *.gitdeps.xml 文件

		查找的同时也会解析 xml 文件，将数据写入到 File, Blob, Pack 中。

	4. 更新
		1. 从 CurrentManifest 中获取所有的文件（这个文件是上次执行 GitDependencies 后产生的，首次执行不会走这个逻辑）
			遍历，判断其中是否有文件发生了写入更新
			如果有会更新 Hash 和 Timestamp (TODO... 这个Hash与配置文件中的Hash没有关系，仅仅用于记录文件更新的标志)
		2. 如果有新的文件加入（不在.ue4dependencies文件中)
			1. 如果本地有这个文件，加入到计算 Timestamp, Hash并加入到 CurrentFileLoopup 中
			2. 不存在则不加入
		3. 是否有文件需要排除, 不排除的加入到 FilteredTargetFiles 中
		4. 遍历所有 FilterTargetFiles 中的文件
			不存在的文件会被加入到 FilesToDownload 中，等待下载
		5. 写入新的信息到 Manifest
		6. 下载
			File.Hash -> Blob.Hash
			Blob.PackHask -> Pack.Hash

			地址：BaseUrl/Pack.RemotePath/Pack.Hash
			


