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



// 圖片點擊放大：頁面有載入 PhotoSwipe 時，綁定 .js-photoSwipe 連結（href 為大圖，需帶 data-pswp-width / data-pswp-height）
$(function(){
	if (!window.PhotoSwipeLightbox) return
	new PhotoSwipeLightbox({ gallery: '.js-photoSwipe', pswpModule: PhotoSwipe }).init()
})


/**
 * 長文收合（.js-readMore）
 * 內容超過 CSS 高度上限才收合並顯示按鈕，可 more / less 切換
 * 字型載入完成、視窗寬度改變時重新判斷，避免字型未載入時誤判行數
 */
class ReadMore {
	constructor(options){
		const def = {
			selector: '.js-readMore',
			minHiddenLines: 3, // 至少隱藏幾行才收合，避免只藏一兩行就出現 more
			moreText: 'more',
			lessText: 'less',
		}

		Object.keys(def).forEach(k => {
			if (options?.[k] !== undefined) def[k] = options[k]
		})
		Object.assign(this, def)

		this.$window = $(window)
		this.lastWidth = window.innerWidth
		this.resizeTimer = null

		this.init()
	}

	init(){
		this.bindEvents()
		this.update()
		document.fonts?.ready.then(() => this.update())
	}

	bindEvents(){
		$(document).off('click.readMore').on('click.readMore', `${this.selector}-btn`, e => {
			this.toggle($(e.currentTarget).closest(this.selector))
		})

		// 只在寬度改變時重新判斷（手機捲動時網址列伸縮也會觸發 resize）
		this.$window.off('resize.readMore').on('resize.readMore', () => {
			if (window.innerWidth === this.lastWidth) return
			this.lastWidth = window.innerWidth
			clearTimeout(this.resizeTimer)
			this.resizeTimer = setTimeout(() => this.update(), 150)
		})
	}

	update(){
		$(this.selector).each((i, el) => this._measure($(el)))
	}

	toggle($root){
		const isOpen = !$root.hasClass('is_open')
		$root.toggleClass('is_open', isOpen)
		this._setBtn($root)

		// 收合時若卡片頂端已捲出畫面，捲回卡片位置
		if (!isOpen && $root[0].getBoundingClientRect().top < 0){
			($root.closest('article')[0] || $root[0]).scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}

	// 以收合狀態量測被隱藏的高度，超過 minHiddenLines 行才保留收合
	_measure($root){
		const isOpen = $root.hasClass('is_open')
		const content = $root.find(`${this.selector}-content`)[0]

		$root.addClass('is_clamped').removeClass('is_open')
		const hidden = content.scrollHeight - content.clientHeight
		const lineHeight = parseFloat(getComputedStyle(content).lineHeight) || 24

		$root.toggleClass('is_clamped', hidden > lineHeight * this.minHiddenLines).toggleClass('is_open', isOpen)
		this._setBtn($root)
	}

	_setBtn($root){
		const isOpen = $root.hasClass('is_open')
		$root.find(`${this.selector}-btn`).text(isOpen ? this.lessText : this.moreText).attr('aria-expanded', isOpen)
	}
}

$(function(){
	if ($('.js-readMore').length) window.readMore = new ReadMore()
})

// TODO 靜態展示用：載入 demo.js（_layout 片段、中英切換）。交接後連同 demo.js 一起刪除
document.head.appendChild(Object.assign(document.createElement('script'), { src: '/static/common/js/demo.js' }))
