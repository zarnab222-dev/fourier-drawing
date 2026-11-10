if (window.location.hostname === 'sketch.zarnab.dev') {
 const link = document.querySelector('.cluster-return:not(.community-link)');
 if (link) {
  link.href = 'https://zarnab.dev/';
  link.innerHTML = '<span aria-hidden="true">←</span> zarnab.dev';
 }
}
const place = () => {
 const target = document.querySelector(".page");
 if(!target || target.querySelector('shin86-signature')) return;
 const host = document.createElement('div'); host.className = 'signature-placement'; host.style.cssText = "--signature-ink:#233d38;display:flex;justify-content:flex-end;padding:20px 28px;";
 host.innerHTML = '<shin86-signature ></shin86-signature>'; target.append(host);
};
place();
new MutationObserver(place).observe(document.body,{childList:true,subtree:true});
