import Quill from 'quill';
const Parchment = Quill.import('parchment');

let SizeClass = new Parchment.Attributor.Class('fontsize', 'ql-fontsize', {
	scope: Parchment.Scope.INLINE,
	whitelist: ['12', '14', '18', '20', '24', '32', '48', '64', '72'],
});
let SizeStyle = new Parchment.Attributor.Style('fontsize', 'ql-fontsize', {
	scope: Parchment.Scope.INLINE,
	whitelist: ['12px', '14px', '18px', '20px', '24px', '32px', '48px', '64px', '72px'],
});

export { SizeClass, SizeStyle };
