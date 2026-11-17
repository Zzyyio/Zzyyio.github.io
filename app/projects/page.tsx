const projects = [
  {
    id: "fluid-sim",
    number: "01",
    year: "2026",
    title: "流体实验室",
    category: "交互实验 / WebGL",
    summary: "在浏览器中推动流体、注入颜料，观察它们如何绕过障碍物。",
    detail: "基于 GPU 的二维流体模拟，支持速度场与颜料显示、可调物理参数，以及圆形、三角形和长方形障碍物的场景编辑。",
    href: "https://zzyyio.github.io/projects/fluid-sim/",
  },
  {
    id: "project-01",
    number: "02",
    year: "2026",
    title: "移动中的档案",
    category: "数字体验 / 创意开发",
    summary: "一个将个人影像、地理片段与声音记录组织为可探索路径的互动档案。",
    detail: "负责视觉系统、交互原型与前端实现。界面不使用传统卡片，而以路径、距离和停留时间组织内容。",
  },
  {
    id: "project-02",
    number: "03",
    year: "2025",
    title: "光线索引",
    category: "出版物 / 摄影",
    summary: "一本研究建筑表面、阴影方向和一天中光线变化的摄影书。",
    detail: "完成图像编辑、网格、字体和印刷打样。数字版本延续纸张中的翻页节奏，但使用连续线条连接章节。",
  },
  {
    id: "project-03",
    number: "04",
    year: "2025",
    title: "缓慢界面",
    category: "研究 / 交互设计",
    summary: "关于低刺激数字界面的自发研究，探索延迟、空白与不连续反馈。",
    detail: "通过一组可运行原型记录不同反馈速度对阅读、注意力和空间感的影响。",
  },
];

export default function ProjectsPage() {
  return (
    <>
      <section className="subpage-hero section-pad" aria-labelledby="projects-title">
        <p className="eyebrow">03 / 03 · PROJECTS</p>
        <h1 id="projects-title">项目</h1>
        <p className="subpage-lede">
          跨越数字产品、影像与编辑设计的项目。每个项目都从一个具体问题开始，并以可被使用、观看或感知的形式结束。
        </p>
        <nav aria-label="项目索引" className="project-index">
          {projects.map((project) => (
            <a href={`#${project.id}`} key={project.id}>{project.number} {project.title}</a>
          ))}
        </nav>
      </section>

      <div className="project-list">
        {projects.map((project) => (
          <article className="project-entry section-pad" id={project.id} key={project.id}>
            <div className="project-entry__meta">
              <span>{project.number}</span>
              <span>{project.year}</span>
              <span>{project.category}</span>
            </div>
            <div className="project-entry__body">
              <h2>{project.title}</h2>
              <p className="project-summary">{project.summary}</p>
              <p>{project.detail}</p>
              <a href={project.href ?? `#${project.id}-details`} id={`${project.id}-details`}>
                {project.href ? "打开流体实验室 ↗" : "项目详情筹备中 ↗"}
              </a>
            </div>
          </article>
        ))}
      </div>

      <section className="contact-strip section-pad">
        <p>项目合作与创意开发</p>
        <a href="mailto:hello@example.com">hello@example.com →</a>
      </section>
    </>
  );
}
