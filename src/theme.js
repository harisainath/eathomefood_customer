export const colors = {
  primary: '#FFC529',      // brand yellow
  primaryDark: '#E5A800',
  primarySoft: '#FFF6D6',
  ink: '#1D1A14',          // text on yellow (dark text keeps contrast readable)
  text: '#26231C',
  muted: '#76705F',
  border: '#EEE8D8',
  bg: '#FFFFFF',
  surface: '#FAF7EF',
  success: '#1A9E5C',
  danger: '#D93F3F',
  veg: '#0F8A3C',
  nonveg: '#B3261E',
};

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

export const statusMeta = {
  placed:    { label: 'Order placed',      color: '#8A6D00', bg: '#FFF6D6' },
  preparing: { label: 'Preparing',         color: '#9A5B00', bg: '#FFEBC7' },
  ready:     { label: 'Ready for pickup',  color: '#22608F', bg: '#E2F0FB' },
  picked_up: { label: 'On the way',        color: '#5B3FA8', bg: '#EEE8FB' },
  delivered: { label: 'Delivered',         color: '#1A7A48', bg: '#E2F5EA' },
  rejected:  { label: 'Rejected',          color: '#B3261E', bg: '#FBE7E5' },
  cancelled: { label: 'Cancelled',         color: '#76705F', bg: '#F1EFEA' },
};

export const rupee = (n) => `₹${Number(n || 0).toFixed(Number(n) % 1 === 0 ? 0 : 2)}`;

export const timeAgo = (iso) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} hr ago` : new Date(iso).toLocaleDateString();
};
