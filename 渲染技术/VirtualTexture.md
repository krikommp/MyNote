## Virtual Texture 介绍

### 1. 起源

#### 1.1 传统纹理贴图
由 <u>**id Software**</u> 开发的 <u>**MegaTexture**</u> 技术，用于解决大地形的纹理贴图问题。
其原理是参考 **Clipmap** 技术，将纹理根据各自的LOD分成多个层级，并设置了一个mipmap上限，将所有超过这个上限的纹理都剔除掉，这些纹理不会被加载到内存中。
当玩家视野发生变化时，修改 clipmap 区域，同时让mipmap部分重新加载卸载。

#### 1.2 Software Virtual Texture
运用了一种类似于虚拟内存的技术，其特点是不会完整的加载一张 Texture 到内存中，而是对 mipmap chain 进行切割，分割成大小相同的 Tile\Page, 并且将这些 Tile\Page 存入到 PageTable 中。然后通过建立某种映射关系，映射到一张物理纹理。当视角发生变化时，一部分 Page 会被卸载，同时加载新的 Page。

##### 1.2.1 映射方法
1. 四叉树
    由于低等级的 mip 是由四个高等级的 mip 合成得到，因此四叉树天然适合保存mipmap信息.
    每个 page 对应一个四叉树节点，计算公式如下：
    physical = virtual * scale + bias
    因此每个四叉树节点都保存着 scale 和 bias 数据，使用时就可以根据 virtual 计算出 physical 的位置。
    但是四叉树搜索效率取决于树的深度，对于高等级的 mipmap 搜索速度快，低等级的 mimap 搜索速度慢，因此对于大型的纹理，四叉树的效率并不高。
2. 单像素对应虚纹理的一个page的映射
    
