/*!*
 * @method: 슬라이더 플러그인
 * @autor: Blim - Koo Chi Hoon(kkh975@naver.com)
 */
( function( $ ) {

	'use strict';

	/**
	 * @method: 슬라이더 플러그인
	 */
	$.fn.scrollbar = function( option ) {
		option.wrapping = option.$wrapping ? option.$wrapping.get( 0 ) : $( this ).get( 0 );
		option.viewport = option.$viewport ? option.$viewport.get( 0 ) : $( this ).find( '>[class$="viewport"]' ).get( 0 );
		option.contents = option.$contents ? option.$contents.get( 0 ) : $( this ).find( '>[class$="contents"]' ).get( 0 );

		return this.each( function( ) {
			$( this ).data( 'scrollbar', new Scrollbar( option ) );
		} );
	};

	/**
	 * @method: 슬라이더 컨텐츠 플러그인
	 */
	$.fn.scrollbar2update = function( ) {
		return this.each( function( ) {
			$( this ).data( 'scrollbar' ).update( );
		} );
	};
}( jQuery ) );


/*!*
 * ScrollBar Plug-in
 *
 * @date 2013-07-13
 * @version 1.0
 * @author Blim - Koo Chi Hoon(kkh975@naver.com)
 * @license http://blim.mit-license.org/
 * @param {Object} setting options
 */
var Scrollbar = function( __setting ) {

	"use strict";

	var SCROLL_CLASS = "scrollbar",
		TRACK_CLASS = "track",
		THUMP_CLASS = "thumb",
		FIRST_THUMB_CLASS = "first-thumb",
		END_THUMB_CLASS = "end-thumb",
		setting = null,
		wrapping = { },
		viewport = { },
		contents = { },
		scrollbar = { },
		track = { },
		thumb = { },
		first_button = { },
		end_button = { },
		start_pos = 0,					// scrollbar의 시작 위치
		touch_start_pos = 0,			// 터치시, 시작 위치
		thumb_click_gap = 0,			// 드래그시 핸들러 처음 클릭과 나중 마우스 위치의 차이
		is_onmouse = false, 			// 마우스 on 여부
		is_axis_x = false,				// 중심 축
		is_buttons = false,				// 버튼 붙일 여부,
		css_pos_attr = '',				// css 위치 설정
		css_size_attr = '',				// css 크기 설정
		css_other_pos_attr = '',		// css 다른면 설정
		css_pos_attr_low = '',			// css 위치 설정(소문자)
		css_size_attr_low = '',			// css 크기 설정(소문자)
		css_other_pos_attr_low = '',	// css 다른면 설정(소문자)

		is_touch_event = 'ontouchstart' in document.documentElement,			// 터치 이벤트 지원 여부
		is_under_ie7 = /MSIE [1-7]{1}\.0/.test( window.navigator.userAgent );	// 브라우저 ie7 이하 체크

	var default_Option = {
		wrapping: null,				// require, 전체 감싸는 dom
		viewport: null,				// require, 보이는 영역 dom
		contents: null,				// require, 내용 dom
		axis: 'y',					// 중심 축
		wheel: 40,					// 움직일 거리
		customClass: 'customClass',	// 클래스
		appendButton: true,			// 버튼 붙일지 여부
		create: null,				// 생성 후 콜백함수
		update: null,				// 업데이트 후 콜백함수
		active: null				// 액션 후 콜백함수
	};

	/**
	 * @namespace 보조 함수
	 */
	var helper = {

		/**
		 * jQuery extend 기능
		 */
		extend: function( _target, _object ) {
			var prop = null,
				return_obj = {};

			for( prop in _target ) {
				return_obj[ prop ] = prop in _object ? _object[ prop ] : _target[ prop ];
			}

			return return_obj;
		},


		/**
		 * @method: 이벤트 추가, lazy load
		 */
		addEvt: function( elem, evtType, handler ) {

			if ( "addEventListener" in elem ) { // DOM
				helper.addEvt = function( elem, evtType, handler ) {
					elem.addEventListener( evtType, handler, false );
				};
			} else if ( "attachEvent" in elem ) { // IE
				helper.addEvt = function( elem, evtType, handler ) {
					elem.attachEvent( "on" + evtType, handler );
				};
			}

			helper.addEvt( elem, evtType, handler );
		},

		/**
		 * @method: 이벤트 제거, lazy load
		 */
		delEvt: function( elem, evtType, handler ) {
			if ( "removeEventListener" in elem ) { // DOM
				helper.delEvt = function( elem, evtType, handler ) {
					elem.removeEventListener( evtType, handler, false );
				};
			} else if ( "detachEvent" in elem ) { // IE
				helper.delEvt = function( elem, evtType, handler ) {
					elem.detachEvent( "on" + evtType, handler );
				};
			}

			helper.delEvt( elem, evtType, handler );
		},

		/**
		 * 기존이벤트 막기
		 */
		stopBaseEvent: function( e ) {
			if ( typeof e.preventDefault === "function" ) {
				helper.stopBaseEvent = function( e ) {
					e.preventDefault( );
				};
			} else if ( e !== "undefined" ) {
				helper.stopBaseEvent = function( e ) {
					e.returnValue = false;
				};
			}

			helper.stopBaseEvent( e );
		},

		/**
		 * @method: 윈도우 기본 스크롤 막기
		 */
		stopScrollEvent: function( e ) {
			if ( is_onmouse ) {
				helper.stopBaseEvent( e );
			}
		},

		/**
		 * @method: 컨텐츠 위치 알아오기
		 * @param {Integer} thump 위치
		 * @return {Integer} content 위치
		 * @descript: 현재 트랙 위치와 비율을 곱해서 얻음
		 */
		getThumpPos2ContentPos: function( _thumb_pos ) {
			return _thumb_pos * track.ratio;
		},

		/**
		 * @method: 핸들러 위치 알아오기
		 * @param {Integer} content 위치
		 * @return {Integer} thump 위치
		 * @descript: 현재 트랙 위치와 비율을 곱해서 얻음
		 */
		getContentPos2ThumpPos: function( _cont_pos ) {
			return _cont_pos * contents.ratio;
		},

		/**
		 * @method: DOM의 body기준 위치 알아오기
		 * @param {Object} 대상 DOM
		 * @return {Object} 정보
		 */
		getABSpos: function( _elem ) {
			if ( "getBoundingClientRect" in _elem ) { // DOM, IE
				helper.getABSpos = function( _elem ) {
					var info = _elem.getBoundingClientRect( ),
						return_info = { },
						prop = null;

					// copy object
					for ( prop in info ) {
						return_info[ prop ] = info[ prop ];
					}

					// width 정보 없을시
					if ( !( "width" in return_info ) ) {
						return_info.width = return_info.right - return_info.left;
					}

					// height 정보 없을시
					if ( !( "height" in return_info ) ) {
						return_info.height = return_info.bottom - return_info.top;
					}

					return return_info;
				};
			} else if ( "getBoxObjectFor" in _elem ) { // FF
				helper.getABSpos = function( _elem ) {
					return _elem.getBoxObjectFor( );
				};
			}

			return helper.getABSpos( _elem );
		}
	};

	/**
	 * @namespace 이벤트 함수
	 */
	var event = {

		/**
		 * 마우스 오버 이벤트
		 *
		 * @param: {Object} event 객체
		 */
		onMouseOver: function( e ) {
			is_onmouse = true;
		},

		/**
		 * 마우스 아웃 이벤트
		 *
		 * @param: {Object} event 객체
		 */
		onMouseOut: function( e ) {
			is_onmouse = false;
		},

		/**
		 * 마우스 휠 이벤트
		 *
		 * @param: {Object} event 객체
		 */
		onWheel: function ( e ) {
			var wheel_delta = 0,
				_cont_pos = contents.pos;

			e = e || window.event;

			// 마우스 휠
			wheel_delta = e.wheelDelta ? e.wheelDelta / 120 : -e.detail / 3;

			// content의 위치
			_cont_pos -= ( wheel_delta * setting.wheel );

			// 셋팅
			setPos( _cont_pos );
		},

		/**
		 * 드래그 시작 이벤트
		 */
		onDragStart: function( e ) {
			var click_pos = 0;

			if ( is_touch_event && e.touches.length === 1 ) {
				e = e.touches[ 0 ];
			}

			// 클릭 위치
			click_pos = touch_start_pos = is_axis_x ?
					( "clientX" in e ? e.clientX : e.pageX ) :
					( "clientY" in e ? e.clientY : e.pageY );
			click_pos = click_pos - start_pos; // track위 클릭 위치

			// 클릭과 핸들러 차이 값
			thumb_click_gap = click_pos - thumb.pos;

			// 드래그 영역 벗어나도 그대로 유지
			helper.addEvt( document, "mousemove", event.onMove );
			helper.addEvt( document, "mouseup", event.onDragEnd );
			helper.addEvt( thumb.elem, "mouseup", event.onDragEnd );

			// 터치 이벤트
			if ( is_touch_event ) {
				helper.addEvt( viewport.elem, "touchmove", event.onMove );
				helper.addEvt( viewport.elem, "touchend", event.onDragEnd );
			}
		},

		/**
		 * 드래그시 이벤트
		 *
		 * @param {Object} event 객체
		 */
		onMove: function( e ) {
			var click_pos = 0,
				_cont_pos = 0,
				_thumb_pos = 0;

			if ( is_touch_event && e.touches.length === 1 ) {
				e = e.touches[ 0 ];
				_cont_pos = contents.pos;

				// 클릭 위치
				click_pos = is_axis_x ?
						( "clientX" in e ? e.clientX : e.pageX ) :
						( "clientY" in e ? e.clientY : e.pageY );

				// content의 위치
				_cont_pos += ( ( touch_start_pos - click_pos ) * track.ratio );

				// 셋팅
				setPos( _cont_pos );

				helper.stopBaseEvent( e );
			} else {

				// 클릭 위치
				click_pos = is_axis_x ?
						( "pageX" in e ? e.pageX : e.clientX ) :
						( "pageY" in e ? e.pageY : e.clientY );
				click_pos = click_pos - start_pos;	// track위 클릭 위치

				// track 위 클릭 위치
				_thumb_pos = click_pos - thumb_click_gap;
				_thumb_pos = Math.min( track.move_size, Math.max( 0, _thumb_pos ) );

				// 셋팅
				setPos( helper.getThumpPos2ContentPos( _thumb_pos ) );
			}
		},

		/**
		 * 드래그 종료 이벤트
		 */
		onDragEnd: function( ) {
			helper.delEvt( document, "mousemove", event.onMove );
			helper.delEvt( document, "mouseup", event.onDragEnd );
			helper.delEvt( thumb.elem, "mouseup", event.onDragEnd );

			// 터치 이벤트
			if ( is_touch_event ) {
				helper.delEvt( viewport.elem, "touchmove", event.onMove );
				helper.delEvt( viewport.elem, "touchend", event.onDragEnd );
			}
		},

		/**
		 * 위버튼 클릭 이벤트
		 *
		 * @param {Object} event 객체
		 */
        onFirstBtnStart: function( ) {
			var pos = contents.pos;

			pos -= setting.wheel;
			setPos( pos );

			if ( first_button.click_timer === null ) {
				first_button.click_timer = setInterval( function( ) {
					event.onFirstBtnStart( );
				}, 100 );
			}
        },

		/**
		 * 위버튼 클릭 이벤트
		 *
		 * @param {Object} event 객체
		 */
        onFirstBtnEnd: function( ) {
			clearInterval( first_button.click_timer );
			first_button.click_timer = null;
        },

		/**
		 * 위버튼 클릭 이벤트
		 *
		 * @param {Object} event 객체
		 */
        onEndBtnStart: function( ) {
			var pos = contents.pos;

			pos += setting.wheel;
			setPos( pos );

			if ( end_button.click_timer === null ) {
				end_button.click_timer = setInterval( event.onEndBtnStart, 100 );
			}
        },

		/**
		 * 위버튼 클릭 이벤트
		 *
		 * @param {Object} event 객체
		 */
        onEndBtnEnd: function( ) {
			clearInterval( end_button.click_timer );
			end_button.click_timer = null;
        }
	};

	/**
	 * @method 시작 셋팅
	 * @return {Boolean} 초기화 가능여부
	 */
	function constructor( ) {
		var is_show = false;

		setting = helper.extend( default_Option, __setting );
		wrapping.elem = setting.wrapping;
		viewport.elem = setting.viewport;
		contents.elem = setting.contents;
		is_buttons = setting.appendButton;
		is_axis_x = setting.axis === 'x';

		// 필수 파라미터 검사
		if ( wrapping.elem === null || viewport.elem === null || contents.elem === null ) {
			console.log( "Check Your Parameters" );
			return false;
		}

		// 파라미터 체크
		if ( typeof setting.wheel !== "number" ) {
			setting.wheel = parseInt( setting.wheel, 10 );

			if ( isNaN( setting.wheel ) ) {
				console.log( "wheel is not number" );
				return false;
			}
		}

		if ( is_buttons ) {
			first_button.click_timer = null;
			end_button.click_timer = null;	
		}

		css_pos_attr = is_axis_x ? 'Left' : 'Top',					// css 위치 설정
		css_size_attr = is_axis_x ? 'Width' : 'Height',				// css 크기 설정
		css_other_pos_attr = is_axis_x ? 'Top' : 'Left',			// css 다른면 설정
		css_pos_attr_low = css_pos_attr.toLowerCase( ),				// css 위치 설정(소문자)
		css_size_attr_low = css_size_attr.toLowerCase( ),			// css 크기 설정(소문자)
		css_other_pos_attr_low = css_other_pos_attr.toLowerCase( );	// css 다른면 설정(소문자)

		setInitDom( );
		is_show = setSize( );
		setInitStyle( );
		setInitStyleAfterSize( );
		setScrollBarToggle( is_show );
		setEvent( );

		if ( typeof setting.create === 'function' ) {
			setting.create( );
		}
	}

	/**
	 * @method 초기 DOM
	 */
	function setInitDom( ) {
		scrollbar.elem = document.createElement( 'div' );
		track.elem = document.createElement( 'div' );
		thumb.elem = document.createElement( 'div' );

		// ie7 이하일 경우, 텍스트 노드 붙이기
		if ( is_under_ie7 ) {
			scrollbar.elem.appendChild( document.createTextNode( ' ' ) );
			track.elem.appendChild( document.createTextNode( ' ' ) );
			thumb.elem.appendChild( document.createTextNode( ' ' ) );
		}

		scrollbar.elem.className = setting.customClass + "-" + SCROLL_CLASS;
		track.elem.className = setting.customClass + "-" + TRACK_CLASS;
		thumb.elem.className = setting.customClass + "-" + THUMP_CLASS;

		// 핸들러 붙이기
		track.elem.appendChild( thumb.elem );

		// 트랙 붙이기
		scrollbar.elem.appendChild( track.elem );

		// 위버튼, 아래버튼 붙이기
		if ( is_buttons ) {
			first_button.elem = document.createElement( 'div' );
			end_button.elem = document.createElement( 'div' );

			// ie7 이하일 경우, 텍스트 노드 붙이기
			if ( is_under_ie7 ) {
				first_button.elem.appendChild( document.createTextNode( ' ' ) );
				end_button.elem.appendChild( document.createTextNode( ' ' ) );
			}

			first_button.elem.className = setting.customClass + "-" + FIRST_THUMB_CLASS;
			end_button.elem.className = setting.customClass + "-" + END_THUMB_CLASS;

			scrollbar.elem.appendChild( first_button.elem );
			scrollbar.elem.appendChild( end_button.elem );
		}

		// 스크롤바 붙이기
		wrapping.elem.appendChild( scrollbar.elem );
	}

	/**
	 * @method 초기 event 셋팅
	 */
	function setEvent( ) {

		// 마우스 오버시, 현재 영역 들어왔다고 표시
		helper.addEvt( wrapping.elem, "mouseover", event.onMouseOver );
		helper.addEvt( wrapping.elem, "mouseout", event.onMouseOut );

		// 트랙 클릭
		helper.addEvt( track.elem, "click", event.onMove );

		// 핸들러 드래그
		helper.addEvt( thumb.elem, "mousedown", event.onDragStart );

		// 컨텐츠 영역 마우스 드래그시
		helper.addEvt( contents.elem, "mousedown", event.onDragStart );

		// 스크롤시
		helper.addEvt( wrapping.elem, "mousewheel", event.onWheel );
		helper.addEvt( wrapping.elem, "DOMMouseScroll", event.onWheel );
		helper.addEvt( wrapping.elem, "MozMousePixelScroll", event.onWheel );

		// 스크롤시 윈도우 기본 스크롤 방지, ie8 이하 지원안됨
		helper.addEvt( window, "mousewheel", helper.stopScrollEvent );
		helper.addEvt( window, "DOMMouseScroll", helper.stopScrollEvent );
		helper.addEvt( window, "MozMousePixelScroll", helper.stopScrollEvent );

		// 이동 버튼
		if ( is_buttons ) {
			helper.addEvt( first_button.elem, "mousedown", event.onFirstBtnStart );
			helper.addEvt( first_button.elem, "mouseout", event.onFirstBtnEnd );
			helper.addEvt( first_button.elem, "mouseup", event.onFirstBtnEnd );

			helper.addEvt( end_button.elem, "mousedown", event.onEndBtnStart );
			helper.addEvt( end_button.elem, "mouseout", event.onEndBtnEnd );
			helper.addEvt( end_button.elem, "mouseup", event.onEndBtnEnd );
		}

		// 터치 이벤트
		if ( is_touch_event ) {
			helper.addEvt( viewport.elem, "touchstart", event.onDragStart );
		}
	}

	/**
	 * @method 초기 스타일
	 */
	function setInitStyle( ) {
		var css_text = "";

		// this
		wrapping.elem.style.position = "relative";

		// viewport
		css_text = "position: relative; overflow: hidden; ";
		css_text += ( css_size_attr_low + ": " + viewport.size + "px;" );
		viewport.elem.style.cssText = css_text;

		// contents
		css_text = "position: absolute; ";
		css_text += ( css_pos_attr + ": " + contents.pos + "px;" );
		css_text += ( css_other_pos_attr + ": " + 0 + "px;" );
		contents.elem.style.cssText = css_text;

		// scrollbar
		css_text = "position: absolute;";
		css_text += ( css_size_attr_low + ": " + scrollbar.size + "px;" );
		css_text += "-webkit-user-select: none;";
		css_text += "-moz-user-select: none;";
		css_text += "-ms-user-select: none;";
		css_text += "-o-user-select: none;";
		css_text += "user-select: none;";
		scrollbar.elem.style.cssText = css_text;

		// track
		css_text = "position: absolute; ";
		css_text += ( css_pos_attr_low + ": " + first_button.size + "px;" );
		css_text += ( css_other_pos_attr + ": " + "0px;" );
		css_text += ( css_size_attr_low + ": " + track.size + "px;" );
		track.elem.style.cssText = css_text;

		// thumb
		css_text = "position: absolute; ";
		css_text += ( css_pos_attr_low + ": " + contents.pos / track.ratio + "px;" );
		css_text += ( css_other_pos_attr + ": " + "0px;" );
		css_text += ( css_size_attr_low + ": " + thumb.size + "px;" );
		thumb.elem.style.cssText = css_text;

		// 위버튼, 아래버튼
		if ( is_buttons ) {

			// first_button
			css_text = "position: absolute; ";
			css_text += ( css_pos_attr_low + ": " + "0px;" );
			css_text += ( css_other_pos_attr + ": " + "0px;" );
			first_button.elem.style.cssText = css_text;

			// end_button
			css_text = "position: absolute; ";
			css_text += ( css_pos_attr_low + ": " + ( first_button.size + track.size ) + "px;" );
			css_text += ( css_other_pos_attr + ": " + "0px;" );
			end_button.elem.style.cssText = css_text;
		}
	}

	/**
	 * @method 스크롤바 업데이트
	 */
	function update( ) {
		var is_show = setSize( );

		setInitStyleAfterSize( );
		setScrollBarToggle( is_show );
		setPos( contents.pos );

		if ( typeof setting.update === 'function' ) {
			setting.update( );
		}
	}

	/**
	 * @method 크기및 위치 설정
	 * @return {Boolean} 컨텐츠 비율이 스크롤 가능 비율인가
	 */
	function setSize( ) {

		// 뷰포트 크기
		viewport.size = helper.getABSpos( viewport.elem )[ css_size_attr_low ];

		// 컨텐츠 크기, 움직일 수 있는 크기
		contents.size = helper.getABSpos( contents.elem )[ css_size_attr_low ];
		contents.move_size = contents.size - viewport.size;

		// 컨텐츠 비율, 위치
		contents.ratio = viewport.size / contents.size;
		contents.pos = "pos" in contents ? contents.pos : 0;

		// 스크롤바 크기
		scrollbar.size = viewport.size;

		// 위버튼, 아래버튼 크기
		if ( is_buttons ) {
			first_button.size = helper.getABSpos( first_button.elem )[ css_size_attr_low ];
			end_button.size = helper.getABSpos( end_button.elem )[ css_size_attr_low ];
		}

		// 트랙 크기, 비율
		track.size = is_buttons ? scrollbar.size - first_button.size - end_button.size : scrollbar.size;
		track.ratio = contents.size / track.size;

		// 핸들러 크기(최소, 최대 사이즈 보장)
		thumb.size = Math.min( track.size, Math.max( 0, track.size * contents.ratio ) );
		thumb.pos = "pos" in thumb ? thumb.pos : 0;

		// 트랙 움직일 수 있는 크기
		track.move_size = track.size - thumb.size;

		return contents.ratio < 1;
	}

	/**
	 * @method 초기 스타일 후 크기및 위치 설정
	 */
	function setInitStyleAfterSize( ) {
		start_pos = track.pos = helper.getABSpos( track.elem )[ css_pos_attr_low ];
		wrapping.pos = helper.getABSpos( wrapping.elem )[ css_pos_attr_low ];
	}

	/**
	 * @method 스크롤바 토글
	 * @param {Boolean} 스크롤바 보일것인가
	 */
	function setScrollBarToggle( _is_show ) {
		scrollbar.elem.style.display = _is_show ? 'block' : 'none';
	}

	/**
	 * @method 위치 셋팅
	 * @param {Number} 컨텐츠 이동할 위치
	 * @param {Number} 핸들러 이동할 위치
	 */
	function setPos( _cont_pos, _thumb_pos ) {
		var args = Array.prototype.slice.call( arguments );

		// cont 범위 지정
		_cont_pos = Math.min( contents.move_size, Math.max( 0, _cont_pos ) );

		// thumb 위치, content의 위치에 track 비율로 맞추기
		if ( args.length === 1 ) {
			_thumb_pos = _cont_pos / track.ratio;
		}

		thumb.elem.style[ css_pos_attr_low ] = _thumb_pos + "px";
		contents.elem.style[ css_pos_attr_low ] = ( _cont_pos *  -1 ) + "px";

		contents.pos = _cont_pos;
		thumb.pos = _thumb_pos;

		if ( typeof setting.active === 'function' ) {
			setting.active( );
		}
	}

	constructor( );

	// 공개 함수
	return {
		update: update
	};
}