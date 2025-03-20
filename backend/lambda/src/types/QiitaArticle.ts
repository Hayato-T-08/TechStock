export type QiitaArticle = {
  id: string;
  title: string;
  url: string;
  tags: QiitaTag[];
  source: 'Qiita';
};

export type QiitaTag = {
  name: string;
};
