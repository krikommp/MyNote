1.1 Nanite 构建过程
	创建 Cluster
	`ClusterTriangles()` --> `E:\UnrealEngine\Engine\Source\Developer\NaniteBuilder\Private\NaniteBuilder.cpp`
	解析：
	首先需要了解两个结构，`FEdgeHash` 和 `FAdjacency`
```C++
class FEdgeHash  
{  
public:  
   FHashTable HashTable;  
  
   FEdgeHash( int32 Num )  
      : HashTable( 1 << FMath::FloorLog2( Num ), Num )  
   {}  
  
   template< typename FGetPosition >  
   void Add_Concurrent( int32 EdgeIndex, FGetPosition&& GetPosition )  
   {  
	   // Cycle3：计算三角形边的顶点，例如 0 -> 1, 1 -> 2, 2 -> 0
	   // 通过这部计算可以的得到三角形中一条边的顶点信息
      const FVector3f& Position0 = GetPosition( EdgeIndex ); 
      const FVector3f& Position1 = GetPosition( Cycle3( EdgeIndex ) );  

		// 生成Hash
      uint32 Hash0 = HashPosition( Position0 );  
      uint32 Hash1 = HashPosition( Position1 );  
      uint32 Hash = Murmur32( { Hash0, Hash1 } );  
  
      HashTable.Add_Concurrent( Hash, EdgeIndex );  
   }  
  
   template< typename FGetPosition, typename FuncType >  
   void ForAllMatching( int32 EdgeIndex, bool bAdd, FGetPosition&& GetPosition, FuncType&& Function )  
   {  
      const FVector3f& Position0 = GetPosition( EdgeIndex );  
      const FVector3f& Position1 = GetPosition( Cycle3( EdgeIndex ) );  
              
      uint32 Hash0 = HashPosition( Position0 );  
      uint32 Hash1 = HashPosition( Position1 );  
      uint32 Hash = Murmur32( { Hash1, Hash0 } );  

		// 找到共享边
      for( uint32 OtherEdgeIndex = HashTable.First( Hash ); HashTable.IsValid( OtherEdgeIndex ); OtherEdgeIndex = HashTable.Next( OtherEdgeIndex ) )  
      {  
         if( Position0 == GetPosition( Cycle3( OtherEdgeIndex ) ) &&  
            Position1 == GetPosition( OtherEdgeIndex ) )  
         {  
            // Found matching edge.  
            Function( EdgeIndex, OtherEdgeIndex );  
         }  
      }  
  
      if( bAdd )  
         HashTable.Add( Murmur32( { Hash0, Hash1 } ), EdgeIndex );  
   }  
};

// 相邻边
struct FAdjacency  
{  
   TArray< int32 >             Direct;  
   TMultiMap< int32, int32 >  Extended;  
  
   FAdjacency( int32 Num )  
   {  
      Direct.AddUninitialized( Num );  
   }  

	// 构造邻边关系
	// 特殊情况下会出现一条边被两个以上的三角形共享
	// 保存在 Extended 中
   void   Link( int32 EdgeIndex0, int32 EdgeIndex1 )  
   {  
      if( Direct[ EdgeIndex0 ] < 0 &&   
         Direct[ EdgeIndex1 ] < 0 )  
      {  
         Direct[ EdgeIndex0 ] = EdgeIndex1;  
         Direct[ EdgeIndex1 ] = EdgeIndex0;  
      }  
      else  
      {  
         Extended.AddUnique( EdgeIndex0, EdgeIndex1 );  
         Extended.AddUnique( EdgeIndex1, EdgeIndex0 );  
      }  
   }  

	// 
   template< typename FuncType >  
   void   ForAll( int32 EdgeIndex, FuncType&& Function ) const  
   {  
      int32 AdjIndex = Direct[ EdgeIndex ];  
      if( AdjIndex != -1 )  
      {  
         Function( EdgeIndex, AdjIndex );  
      }  
  
      for( auto Iter = Extended.CreateConstKeyIterator( EdgeIndex ); Iter; ++Iter )  
      {  
         Function( EdgeIndex, Iter.Value() );  
      }  
   }  
};
```
	接着构建边Hash和共享边
```C++
FAdjacency Adjacency( Indexes.Num() );  
FEdgeHash EdgeHash( Indexes.Num() );  
  
auto GetPosition = [ &Verts, &Indexes ]( uint32 EdgeIndex )  
{  
   return Verts[ Indexes[ EdgeIndex ] ].Position;  
};  
  
ParallelFor( TEXT("Nanite.ClusterTriangles.PF"), Indexes.Num(), 4096,  
   [&]( int32 EdgeIndex )  
   {  
      EdgeHash.Add_Concurrent( EdgeIndex, GetPosition );  
   } );  
  
ParallelFor( TEXT("Nanite.ClusterTriangles.PF"), Indexes.Num(), 1024,  
   [&]( int32 EdgeIndex )  
   {  
      int32 AdjIndex = -1;  
      int32 AdjCount = 0;  

		// 将同位置不同方向的两条边切开
      EdgeHash.ForAllMatching( EdgeIndex, false, GetPosition,  
         [&]( int32 EdgeIndex, int32 OtherEdgeIndex )  
         {  
            AdjIndex = OtherEdgeIndex;  
            AdjCount++;  
         } );  

		// 一条边被两个以上的三角形共享
      if( AdjCount > 1 )  
         AdjIndex = -2;  
  
      Adjacency.Direct[ EdgeIndex ] = AdjIndex;  
   } );
```
	