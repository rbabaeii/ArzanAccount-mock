import xss from 'xss';
import sanitizeHtml from 'sanitize-html';

export const sanitizeString = (value: string): string => {
  if (!value) return '';
  const noHtml = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return xss(noHtml).trim();
};
