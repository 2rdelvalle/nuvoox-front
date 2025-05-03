export const Generalfetcher = (url : string) => fetch(url).then((res) => res.json())
