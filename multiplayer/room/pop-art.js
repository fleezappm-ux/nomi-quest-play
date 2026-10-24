// Decoration only: every file contains an illustration, with no instructions or controls.
// 0.43 gold: ChatGPT kit art (gold/) where the kit has it; other screens keep the older art/ files.
const KIT=new Set(['battery','buttons','danger','king','majority','mind','mission','muttsuri','reaction','tapking','ten','vote']);
const MAP={check:'drinktime',rest:'icon-check',settle:'drinktime',final:'icon-cheers',end:'icon-cheers',home:'home-hero',welcome:'home-hero'};
export const isIcon=key=>/^icon-/.test(MAP[key]||'');
export const artPath=key=>MAP[key]?'gold/'+MAP[key]+'.webp':KIT.has(key)?'gold/card-'+key+'.webp':'art/'+key+'.webp';
