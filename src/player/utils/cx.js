/** Join truthy class names. */
export const cx = (...classes) => classes.filter(Boolean).join(' ');
