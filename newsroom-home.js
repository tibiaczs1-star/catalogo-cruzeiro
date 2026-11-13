(async () => {
  const response = await fetch('/api/editores/publicadas');
  if (!response.ok) return;
  const articles = await response.json();
  const headline = articles.find(article => article.level === 2);
  for (const article of articles) {
    const section = document.querySelector(article === headline ? '#redacao-manchete' :
      article.level > 0 ? '#redacao-destaques' : '#redacao-feed');
    const card = document.createElement('article');
    card.id = 'redacao-' + article.id;
    card.className = article === headline ? 'redacao-headline' : 'news-card';
    const copy = document.createElement('div');
    copy.className = article === headline ? 'redacao-headline-copy' : 'lead-copy';
    const title = document.createElement('h2');
    const link = document.createElement('a');
    link.href = '/editores?publicadas&materia=' + encodeURIComponent(article.id);
    link.textContent = article.title;
    title.append(link);
    const summary = document.createElement('p');
    const content = article.content.replace(/\s+/g, ' ').trim();
    summary.textContent = content.length > 180 ? content.slice(0, 177) + '…' : content;
    copy.append(title, summary);
    const photo = article.hasMedia && article.mediaType?.startsWith('image/');
    if (photo || article === headline) {
      const image = document.createElement('img');
      image.src = photo ? '/api/editores/midia/' + encodeURIComponent(article.id)
        : '/assets/home-cache/rio-jurua-panorama.jpg';
      image.alt = photo ? '' : 'Vista panoramica do Rio Jurua, imagem ilustrativa';
      card.append(image);
    }
    card.append(copy);
    (section.querySelector('.feed-grid') || section).append(card);
    section.hidden = false;
  }
  if (headline) document.querySelector('.hero-grid').hidden = true;
  if (location.hash.startsWith('#redacao-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
})().catch(error => console.warn('Falha ao carregar matérias da redação.', error));
