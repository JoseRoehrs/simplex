type Method = 'simplex' | 'duas-fases';

type Video = {
  id: string;
  title: string;
  author: string;
  method: Method;
  description: string;
};

const METHOD_LABEL: Record<Method, string> = {
  simplex: 'Método Simplex',
  'duas-fases': 'Simplex Duas Fases',
};

/**
 * Aulas selecionadas (pt-BR) sobre o Método Simplex e o Simplex Duas Fases.
 * Cada vídeo foi verificado: título, canal e disponibilidade conferidos.
 */
const VIDEOS: Video[] = [
  {
    id: 'w047PccELc4',
    title: 'Método Simplex: Passo a passo',
    author: 'Douglas Goios',
    method: 'simplex',
    description:
      'Resolução completa de um PPL pelo método Simplex (fase única), montando o quadro e ' +
      'mostrando entrada/saída de variáveis iteração por iteração. Ótimo primeiro contato com o algoritmo.',
  },
  {
    id: 'PUkSguD6e1E',
    title: 'Simplex — Método das Duas Fases',
    author: 'Prof. Milena Brandão',
    method: 'duas-fases',
    description:
      'Explica por que e quando precisamos das duas fases (restrições ≥ e de igualdade), com ' +
      'variáveis artificiais, a função objetivo auxiliar da Fase 1 e a transição para a Fase 2.',
  },
  {
    id: 'Mme5WnQu-cc',
    title: 'M-grande e Duas Fases: Inicialização do Método Simplex',
    author: 'Pedro Munari (UFSCar)',
    method: 'duas-fases',
    description:
      'Aula acadêmica que compara as duas estratégias de inicialização — método do M-grande (Big-M) ' +
      'e método das Duas Fases — formalizando o tratamento das variáveis artificiais. Mais aprofundado.',
  },
];

export function VideosView() {
  return (
    <div className="videos">
      <p className="videos-intro">
        Aulas selecionadas, em <b>português</b>, sobre como resolver Programação Linear pelo{' '}
        <b>Método Simplex</b> e pelo <b>Simplex Duas Fases</b>. Assista e depois resolva os seus
        próprios problemas nas abas <b>Resolver</b> e <b>Workflow</b>.
      </p>

      <div className="video-grid">
        {VIDEOS.map((v) => (
          <article className="video-card" key={v.id}>
            <div className="video-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                title={v.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="video-meta">
              <span className={`video-tag tag-${v.method}`}>{METHOD_LABEL[v.method]}</span>
              <h3 className="video-title">{v.title}</h3>
              <p className="video-author">{v.author}</p>
              <p className="video-desc">{v.description}</p>
              <a
                className="video-link"
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Assistir no YouTube ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
