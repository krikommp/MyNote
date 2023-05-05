### 构建

#### fix

update-metrics:
```typescript
    // 这个语句会出错
    const refreshUserRank = async () =>
      await dbWrite.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY "UserRank"');
```


schema.prisma:
```prisma
/// 删除了 hash, 考虑重新加回来
model ImageResourceHelper {
  id                    Int        @id
  imageId               Int
  image                 Image      @relation(fields: [imageId], references: [id])
  reviewId              Int?
  reviewRating          Int?
  reviewDetails         String?
  reviewCreatedAt       DateTime?
  name                  String?
  modelVersionId        Int?
  modelVersionName      String?
  modelVersionCreatedAt DateTime?
  modelId               Int?
  modelName             String?
  modelRating           Float?
  modelRatingCount      Int?
  modelDownloadCount    Int?
  modelCommentCount     Int?
  modelFavoriteCount    Int?
  modelType             ModelType?

  @@unique([imageId, name, modelVersionId])
}
```

bucket丢失
目前是手动创建了一个bucket 需要找到原因

获取图片地址
```typescript
export function getEdgeUrl(src: string, { name, ...variantParams }: Omit<EdgeUrlProps, 'src'>) {
  if (!src || src.startsWith('http') || src.startsWith('blob')) return src;

  const params = Object.entries(variantParams)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

  name = name ?? src;
  if (name.includes('.')) name = name.split('.').slice(0, -1).join('.') + '.jpeg';
  else name = name + '.jpeg';

  return [env.NEXT_PUBLIC_IMAGE_LOCATION, src, params.toString(), name].join('/');
}

// 组件
export function EdgeImage({
  src,
  width,
  height,
  fit,
  anim,
  blur,
  quality,
  gravity,
  className,
  name,
  ...imgProps
}: EdgeImageProps) {
  const { classes, cx } = useStyles({ maxWidth: width });
  const currentUser = useCurrentUser();

  if (width) width = Math.min(width, 4096);
  if (height) height = Math.min(height, 4096);
  const isGif = imgProps.alt?.endsWith('.gif');
  anim ??= isGif && currentUser ? (!currentUser.autoplayGifs ? false : undefined) : undefined;
  const gamma = anim === false ? 0.99 : undefined;
  if (anim && !isGif) anim = undefined;
  const optimized = currentUser?.filePreferences?.imageFormat === 'optimized';

  src = getEdgeUrl(src, {
    width,
    height,
    fit,
    anim,
    blur,
    quality,
    gravity,
    optimized: optimized ? true : undefined,
    gamma,
    name,
  });
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  return <img className={cx(classes.responsive, className)} src={src} {...imgProps} />;
}
```