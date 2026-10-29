set100vh()
window.onresize = function(){
	set100vh()
}

function set100vh(){
	document.documentElement.style.setProperty('--100vh', window.innerHeight + 'px' )
}
/**
 * 確認視窗（_layout/modal.html 的 #confirmModal）
 * @param {Object} options
 * @param {string} options.title 標題
 * @param {string} options.content 內容，可傳 HTML
 * @param {string} options.btnOkText 確認鈕文字
 * @param {string} options.btnCancelText 取消鈕文字
 * @param {Function} options.okFunction 按下確認後執行；回傳 false 則不關閉視窗
 * @param {Function} options.cancelFunction 按下取消後執行
 */
function _confirm(options){
	const def = {
		title: '',
		content: '',
		btnOkText: 'Confirm 確認',
		btnCancelText: 'Cancel 取消',
		okFunction: null,
		cancelFunction: null,
	}
	const opt = { ...def, ...options }
	const $modal = $('#confirmModal')
	if (!$modal.length) return // modal.html 尚未載入

	const $btnOk = $modal.find('.js-confirm-ok')
	const $btnCancel = $modal.find('.js-confirm-cancel')
	const modal = bootstrap.Modal.getOrCreateInstance($modal[0])

	$('#confirmModalTitle').html(opt.title)
	$modal.find('.js-confirm-content').html(opt.content)
	$btnOk.text(opt.btnOkText)
	$btnCancel.text(opt.btnCancelText)

	// 每次呼叫重新綁定，避免沿用上一次的 callback
	$btnOk.off('click.confirm').on('click.confirm', function(){
		if (opt.okFunction?.() === false) return
		modal.hide()
	})
	$btnCancel.off('click.confirm').on('click.confirm', function(){
		opt.cancelFunction?.()
	})

	modal.show()
}



// 圖片點擊放大：頁面有載入 PhotoSwipe 時，綁定 .js-zoom 連結（href 為大圖，需帶 data-pswp-width / data-pswp-height）
$(function(){
	if (!window.PhotoSwipeLightbox) return
	new PhotoSwipeLightbox({ gallery: '.js-zoom', pswpModule: PhotoSwipe }).init()
})

// TODO 靜態展示用：載入 demo.js（_layout 片段、中英切換）。交接後連同 demo.js 一起刪除
document.head.appendChild(Object.assign(document.createElement('script'), { src: '/static/common/js/demo.js' }))
