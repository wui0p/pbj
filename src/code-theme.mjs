// Syntax-highlighting theme built only from the site palette.
// Code blocks sit on ink; keywords are butter, values are sky.
const ink = '#404040';
const paper = '#FAF9F6';
const sand = '#EFEBD8';
const sky = '#B6D5D8';
const butter = '#FDDB88';

/** @type {import('shiki').ThemeRegistration} */
export default {
  name: 'jeffrey-ink',
  type: 'dark',
  colors: {
    'editor.background': ink,
    'editor.foreground': paper,
  },
  tokenColors: [
    { settings: { foreground: paper, background: ink } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: sand + 'A6', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.other'],
      settings: { foreground: butter },
    },
    {
      scope: ['string', 'constant', 'constant.numeric', 'constant.language', 'support.constant'],
      settings: { foreground: sky },
    },
    {
      scope: ['entity.name.function', 'entity.name.type', 'entity.name.class', 'support.function', 'support.type'],
      settings: { foreground: paper, fontStyle: 'bold' },
    },
    {
      scope: ['keyword.operator', 'punctuation'],
      settings: { foreground: sand },
    },
  ],
};
