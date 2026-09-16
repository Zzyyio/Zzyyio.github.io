/* eslint-disable @next/next/no-img-element */

const photographs = [
  {
    src: "/photos/photo-mountain.png",
    alt: "云层、山脉与湖面的黑白风景",
    title: "远处的重量",
    meta: "山与水 / 2025",
    className: "photo-item photo-item--wide",
    width: 1536,
    height: 1024,
  },
  {
    src: "/photos/photo-architecture.png",
    alt: "硬光下的粗野主义建筑与一棵树",
    title: "光的边界",
    meta: "建筑研究 / 2025",
    className: "photo-item photo-item--portrait",
    width: 1536,
    height: 1024,
  },
  {
    src: "/photos/photo-botanical.png",
    alt: "具有雕塑感光影的叶片黑白特写",
    title: "无声生长",
    meta: "植物习作 / 2026",
    className: "photo-item photo-item--square",
    width: 1024,
    height: 1536,
  },
];

export default function PhotographyPage() {
  return (
    <>
      <section className="subpage-hero section-pad" aria-labelledby="photography-title">
        <p className="eyebrow">02 / 03 · PHOTOGRAPHY</p>
        <h1 id="photography-title">摄影作品</h1>
        <p className="subpage-lede">
          这些照片来自持续的步行与等待。我拍摄自然、建筑和微小的表面，寻找光线让日常事物暂时陌生的瞬间。
        </p>
      </section>

      <section className="photo-grid section-pad" aria-label="摄影系列">
        {photographs.map((photo, index) => (
          <figure className={photo.className} key={photo.src}>
            <div className="photo-frame">
              <img
                alt={photo.alt}
                height={photo.height}
                loading={index === 0 ? "eager" : "lazy"}
                sizes={index === 0 ? "(max-width: 800px) 100vw, 66vw" : "(max-width: 800px) 84vw, 50vw"}
                src={photo.src}
                width={photo.width}
              />
            </div>
            <figcaption>
              <span>{photo.title}</span>
              <span>{photo.meta}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="series-notes section-pad" aria-labelledby="series-title">
        <p className="section-index">系列札记</p>
        <div>
          <h2 id="series-title">观看发生在按下快门之前。</h2>
          <p>
            我保留低饱和度与清晰的明暗关系，让时间、天气与材料本身成为画面的结构。这里会继续加入城市边缘、室内光线和人物距离三个长期系列。
          </p>
        </div>
      </section>

      <section className="contact-strip section-pad">
        <p>照片授权、编辑委托与展览合作</p>
        <a href="mailto:hello@example.com">hello@example.com →</a>
      </section>
    </>
  );
}
