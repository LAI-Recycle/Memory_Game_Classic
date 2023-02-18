// 放在文件最上方的狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

// view
const view = {
  // 牌的正反面顯示
  // 背面
  // 記得放入data-index="${index}"，使索引數字方便抓取
  getCardElement (index) {
    return `<div data-index="${index}" class="card back"></div>`
  },
  //正面   
  getCardContent (index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  },
  transformNumber (number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  //被controller 呼叫 
  displayCards (indexes) {
    const rootElement = document.querySelector('#cards')
    //indexes注意修改
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  // ... 「展開運算子 (spread operator)」
  flipCards(... cards){
    cards.map( card => {
      if(card.classList.contains("back")){
      //回傳正面
      card.classList.remove("back")
      //card.dataset.index抓取項目index
      //console.log(card.dataset.index)
      card.innerHTML = this.getCardContent(Number(card.dataset.index))
      return
      }
      //回傳背面
      card.classList.add("back")
      card.innerHTML = null
    })
  } ,

  //如果牌match
  pairCards(...cards){
    cards.map( card =>{
      card.classList.add("paired")
    })
  },

  //分數呼叫
  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`;
  },
  //次數的呼叫
  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`;
  },

  //典籍如果錯誤的呼叫
  appendWrongAnimation(...cards) {
  cards.map(card => {
    //在CSS加入wrong
    card.classList.add('wrong')
    card.addEventListener('animationend', event =>   event.target.classList.remove('wrong'), { once: true })
    })
    //拿到wrong後會再移除
    //{once: true} 是要求在事件執行一次之後，就要卸載這個監聽器。
  },
  // Game finished 
  showGameFinished () {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

//宣告 Model
//用於紀錄卡片是否相同
const model = {
  revealedCards: [],

  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13 
  },

  // 新增關於分數資料
  score: 0,
  triedTimes: 0
}

//view 或 model 等其他元件只有在被 controller 呼叫時
//不要讓 controller 以外的內部函式暴露在 global 的區域
const controller = {
  // 在初始狀態設定為 FirstCardAwaits，也就是「還沒翻牌」
  currentState: GAME_STATE.FirstCardAwaits,
  //在 controller 內部呼叫 view.displayCards
  generateCards () {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  //紀錄狀態
  //依照不同狀態進行改變
  dispatchCardAction (card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.renderTriedTimes(++model.triedTimes)//只要切換至 SecondCardAwaits，嘗試次數就要 +1
        view.flipCards(card)
        //存入revealedCards
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        if ( model.isRevealedCardsMatched() ){
          //配對正確
          view.renderScore(model.score += 10)  //如果配對成功，分數就要 +10
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards( ...model.revealedCards)
          this.currentState = GAME_STATE.FirstCardAwaits
          //記得使用空格
          model.revealedCards = []

          /** Game finished **/
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
        } else {
          //配對失敗
          view.appendWrongAnimation(...model.revealedCards) 
          this.currentState = GAME_STATE.CardsMatchFailed
          setTimeout( this.resetCard,1000)//1000就是1秒鐘
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },

  //修掉setTimeout太過長的問題
  //this 要指向 controller，然而當我們把 resetCards 當成參數傳給 setTimeout 時，this 的對象變成了 setTimeout
  resetCard () {
    view.flipCards( ...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  },


}

const utility = {
  getRandomNumberArray (count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

//最初始呼叫controller
controller.generateCards()

// 開始製作翻牌監聽器
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})

