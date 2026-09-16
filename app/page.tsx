import Link from "next/link";

const practices = [
  ["01", "视觉叙事", "以图像、节奏和留白建立清晰的观看路径。"],
  ["02", "交互设计", "让移动、点击和滚动成为内容的一部分。"],
  ["03", "影像创作", "记录光线、空间与人的短暂关系。"],
];

export default function Home() {
  return (
    <>
      <section className="hero-section section-pad" aria-labelledby="intro-title">
        <p className="eyebrow">01 / 03 · INTRO</p>
        <div className="hero-copy">
          <h1 id="intro-title">独立设计师<br />与摄影师</h1>
          <p>
            我关注图像、空间与数字媒介之间的关系，制作克制、清晰，同时保留触感的视觉体验。
          </p>
        </div>
        <span className="scroll-note">向下浏览</span>
      </section>

      <section className="statement-section section-pad" aria-labelledby="statement-title">
        <p className="section-index">A / 自述</p>
        <div className="statement-copy">
          <h2 id="statement-title">设计不是添加更多，而是找到最准确的关系。</h2>
          <div className="body-columns">
            <p>
              我的工作从观察开始：一束光如何经过建筑，一张照片如何改变页面的节奏，一次移动如何提示下一个动作。
            </p>
            <p>
              我在品牌、编辑设计、数字产品和创意开发之间工作，用一致的视觉语言连接概念与实现。
            </p>
          </div>
        </div>
      </section>

      <section className="practice-section section-pad" aria-labelledby="practice-title">
        <div className="section-heading">
          <p className="section-index">B / 方法</p>
          <h2 id="practice-title">工作方式</h2>
        </div>
        <ol className="practice-list">
          {practices.map(([index, title, description]) => (
            <li key={index}>
              <span>{index}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="next-section section-pad" aria-labelledby="explore-title">
        <p className="section-index">C / 继续</p>
        <h2 id="explore-title">沿着线条继续观看</h2>
        <div className="next-links">
          <Link href="/photography">
            <span>摄影作品</span><span>查看系列 →</span>
          </Link>
          <Link href="/projects">
            <span>项目</span><span>查看案例 →</span>
          </Link>
        </div>
      </section>
    </>
  );
}
