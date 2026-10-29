/**
 * 靜態展示專用（由 main.js 載入）
 * HTML 內所有 TODO- 屬性換成後端 Thymeleaf 語法後，即可刪除：
 * - 本檔 demo.js
 * - main.js 載入 demo.js 的那段（已標 TODO）
 * - /static/common/i18n/（轉成 messages_en.properties 後）
 *
 * TODO- 屬性對照：
 * | 靜態（demo.js 處理）                         | Thymeleaf                                        |
 * |---------------------------------------------|--------------------------------------------------|
 * | TODO-replace="/templates/_layout/header.html" | th:replace="~{_layout/header :: header}"         |
 * | TODO-i18n="key"                              | th:text="#{key}"                                 |
 * | TODO-i18n-html="key"（內含 <br>）             | th:utext="#{key}"                                |
 * | TODO-i18n-attr="aria-label:key"              | th:attr="aria-label=#{key}"                      |
 *
 * 其他：
 * - 中文預設字串即 HTML 原文，請後端整理成 messages.properties；英文見 i18n/en.json
 * - header 語系切換連結的 href 已是 ?lang=，後端以 LocaleChangeInterceptor（paramName: lang）接手；
 *   .js-lang-switch 與 is_active / aria-current 改由後端依目前語系輸出
 */


/**
 * 載入 _layout 共用片段
 * 全部載入完成後觸發 document 的 partials:loaded 事件
 */
function loadPartials(){
	const requests = $('[TODO-replace]').map((i, el) => {
		return $.get($(el).attr('TODO-replace')).then(res => { el.outerHTML = res })
	}).get()

	return $.when(...requests).then(() => $(document).trigger('partials:loaded'))
}


/**
 * 中英切換
 * 中文直接寫在 HTML 當預設，英文查 dictUrl 字典；切回中文時還原 HTML 原文
 */
class I18n {
	constructor(options){
		const def = {
			defaultLang: 'zh-Hant',
			langs: ['zh-Hant', 'en'],
			dictUrl: '/static/common/i18n/{lang}.json',
			storageKey: 'lang',
		}

		Object.keys(def).forEach(k => {
			if (options?.[k] !== undefined) def[k] = options[k]
		})
		Object.assign(this, def)

		this.$html = $('html')
		this.lang = this.defaultLang
		this.dicts = {}

		this.init()
	}

	init(){
		this.bindEvents()
		this.setLang(this._getInitLang())
	}

	bindEvents(){
		// header 為動態載入，用事件委派
		$(document).off('click.i18n').on('click.i18n', '.js-lang-switch', e => {
			e.preventDefault()
			this.setLang($(e.currentTarget).data('lang'))
		})
		// _layout 片段載入完成後補翻譯
		$(document).off('partials:loaded.i18n').on('partials:loaded.i18n', () => this.render())
	}

	setLang(lang){
		if (!this.langs.includes(lang)) lang = this.defaultLang
		this.lang = lang
		this.$html.attr('lang', lang) // 帶動 main.css 的 :root:lang(en) 字型切換
		this._saveLang(lang)
		this._syncUrl(lang)

		if (lang === this.defaultLang || this.dicts[lang]) return this.render()

		$.ajax({
			url: this.dictUrl.replace('{lang}', lang),
			method: 'GET',
			dataType: 'json',
			success: res => {
				this.dicts[lang] = res
				this.render()
			},
			error: () => console.error(`[i18n] 字典載入失敗：${lang}`),
		})
	}

	render(){
		if (this.lang !== this.defaultLang && !this.dicts[this.lang]) return // 字典載入中，載完會再 render

		$('[TODO-i18n]').each((i, el) => {
			const $el = $(el)
			$el.text(this._t($el.attr('TODO-i18n'), this._origin($el, 'text', () => $el.text())))
		})
		$('[TODO-i18n-html]').each((i, el) => {
			const $el = $(el)
			$el.html(this._t($el.attr('TODO-i18n-html'), this._origin($el, 'html', () => $el.html())))
		})
		$('[TODO-i18n-attr]').each((i, el) => {
			const $el = $(el)
			$el.attr('TODO-i18n-attr').split(';').forEach(pair => {
				const [attr, key] = pair.split(':').map(s => s.trim())
				$el.attr(attr, this._t(key, this._origin($el, attr, () => $el.attr(attr))))
			})
		})
		$('.js-lang-switch').each((i, el) => {
			const isActive = $(el).data('lang') === this.lang
			$(el).toggleClass('is_active', isActive).attr('aria-current', isActive ? 'true' : null)
		})
	}

	// 第一次替換前記住 HTML 原本的中文，切回中文時還原
	_origin($el, type, getter){
		const origins = $el.data('i18nOrigin') || {}
		if (!(type in origins)) origins[type] = getter()
		$el.data('i18nOrigin', origins)
		return origins[type]
	}

	// 中文回傳原文；英文查字典，查不到保留中文並提示缺少的 key
	_t(key, origin){
		if (this.lang === this.defaultLang) return origin
		const value = this.dicts[this.lang][key]
		if (value === undefined) console.warn(`[i18n] 缺少 key：${key}`)
		return value ?? origin
	}

	// 順序：網址 ?lang= → 上次選擇 → 預設中文
	_getInitLang(){
		const urlLang = new URLSearchParams(location.search).get('lang')
		if (urlLang) return urlLang
		try { return localStorage.getItem(this.storageKey) || this.defaultLang } catch (e) { return this.defaultLang }
	}

	_saveLang(lang){
		try { localStorage.setItem(this.storageKey, lang) } catch (e) {}
	}

	// 網址有帶 ?lang= 時同步更新，避免重新整理又切回舊語系
	_syncUrl(lang){
		const url = new URL(location.href)
		if (!url.searchParams.has('lang')) return
		url.searchParams.set('lang', lang)
		history.replaceState(null, '', url)
	}
}


$(function(){
	window.i18n = new I18n() // 需先綁定 partials:loaded，再載入片段
	loadPartials()
})
