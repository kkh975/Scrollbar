Scrollbar
=========

##Introduce
웹브라우저에서 사용되는 기본 스크롤바입니다.

[Demo](https://kkh975.github.io/SwipeBase)

##How to Use
####HTML
아래와 같이 감싸는 태그와 보일 영역의 태그, 그리고 내용 태그로 작성합니다.
```html
<div class="wrap">
	<div class="box">
		<div class="content">
			...
		</div>
	</div>
</div>
```

####CSS
전체 감싸는 태그와 내용 감싸는 태그는 반드시 가로, 세로 길이를 명시하여야 합니다. 
다만 세로 길이를 퍼센트로 명시할 경우 화면에서 보이지 않을 수 있습니다.
한가지 주의할 점은, Javascript로 생성된 클래스(기본:  customClass)를 중심으로 작성하여 합니다.
```css
.customClass {
	width: 100%;
	height: 250px;
}
.customClass-viewport {
	width: 100%;
	height: 248px;
	border: 1px solid #e5e5e5;
}
.customClass-scrollbar {
	top: 0px;
	right: 0px;
	width: 15px;
}
.customClass-track {
	width: 15px;
	height: 15px;
	background: #e5e5e5;
}
.customClass-thumb {
	width: 15px;
	height: 15px;
	background: #ccc;
}
.customClass-first-thumb {
	width: 15px;
	height: 15px;
	background: #b3b3b3;
}
.customClass-end-thumb {
	width: 15px;
	height: 15px;
	background: #b3b3b3;
}
```

####JAVASCRIPT
jquery 플러그인을 작성할 경우 아래와 같이 작성합니다.
```javascript
$( '.customClass' ).scrollbar( );
```
javascript으로 작성할 경우 아래와 같이 작성합니다.
```javascript
new Scrollbar( {
	wrapping: document.getElementsByClassName( 'customClass' )[ 0 ],
	viewport: document.getElementsByClassName( 'customClass-viewport' )[ 0 ],
	contents: document.getElementsByClassName( 'customClass-contents' )[ 0 ]
} );
```

##method
+ update: 내용 업데이트

####jquery option
+ $wrapping: {jQuery Selector} (default: $( this )) 전체 감쌈
+ $viewport: {jQuery Selector} (default: $( this ).find( '>[class$="viewport"]' )) 보이는 영역
+ $contents: {jQuery Selector} (default: $( this ).find( '>[class$="contents"]' )) 내용 영역

####javascript option
+ wrapping: <u>required</u> {elements} (default: null) 전체 감쌈
+ viewport: <u>required</u> {elements} (default: null) 보이는 영역
+ contents: <u>required</u> {elements} (default: null) 내용 영역

####common option
+ axis: {String} (Default: 'y') 스크롤바가 생성될 축
+ wheel: {Integer} (Default: 40) 마우스 휠로 스크롤할 시 스크롤바 움직일 정도
+ customClass: {String} (Default: 'customClass') 사용자 클래스
+ appendButton: {Boolean} (Default: true) 상/하 스크롤바 버튼 사용 여부, 혹은 좌/우
+ create: {Function} (default: null) 생성시 콜백 함수
+ update: {Function} (default: null) 업데이트 후 콜백 함수
+ active: {Function} (default: null) 스크롤 후 콜백 함수

Copyrights
----------
- license: http://blim.mit-license.org/
- site: http://www.blim.co.kr/
- email: kkh975@naver.com