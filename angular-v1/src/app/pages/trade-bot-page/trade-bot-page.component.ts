
import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TdApiService, BuyOrSell } from '../../services/td-api/td-api.service';
import { ToastManagerService } from '../../services/toast-manager/toast-manager.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { EnableGainslockerModalService } from '../../components/modals/enable-gainslock-confirm/enable-gainslock-modal.service';
import { AskCancelOrderModalService } from '../../components/modals/ask-cancel-order/ask-cancel-order-modal.service';
import { AskPlaceTradeModalService } from 'src/app/components/modals/ask-place-trade/ask-place-trade-modal.service';
import { interval } from 'rxjs';
import { decideLimitPrice } from 'src/app/services/limit-price-decider';
import { decideBuyOrSell } from 'src/app/services/buy-or-sell-decider';

const fakeBuyOrder1 = {
  quantity: 1,
  price: 2,
  orderLegCollection: [{
    instruction: 'BUY',
    instrument: {
      symbol: 'MSFT'
    }
  }],
  reasons: [{
    text: 'spike up in volume',
  },
  {
    text: 'just picked up a great new CTO'
  },
  {
    text: 'price has been steadily climbing'
  },
  {
    text: 'triple gainers list 10/14/2020 with 80% buy recc'
  }]

}

const fakeBuyOrder2 = {
  quantity: 2,
  price: 3.45,
  orderLegCollection: [{
    instruction: 'BUY',
    instrument: {
      symbol: 'AAPL'
    }
  }],
  reasons: [{
    text: 'spike up in volume',
  },
  {
    text: 'just picked up a great new CTO'
  },
  {
    text: 'price has been steadily climbing'
  },
  {
    text: 'triple gainers list 10/14/2020 with 80% buy recc'
  }
  ]

}

const fakeBuyOrder3 = {
  quantity: 1,
  price: 265.23,
  orderLegCollection: [{
    instruction: 'BUY',
    instrument: {
      symbol: 'TSLA'
    }
  }],
  reasons: [{
    text: 'spike up in volume',
  },
  {
    text: 'just picked up a great new CTO'
  },
  {
    text: 'price has been steadily climbing'
  },
  {
    text: 'triple gainers list 10/14/2020 with 80% buy recc'
  }
  ]

}

const fakeSellOrder1 = {
  quantity: 1,
  price: 1000,
  orderLegCollection: [{
    instruction: 'SELL',
    instrument: {
      symbol: 'TSLA'
    }
  }]
}

@Component({
  selector: 'app-trade-bot-page',
  templateUrl: './trade-bot-page.component.html',
  styleUrls: ['./trade-bot-page.component.scss'],
})
export class TradeBotPageComponent {

  accountNumber: string;
  currentEquityPositions: any[];
  currentOptionPositions: any[];
  currentCashPositions: any[];

  openSellOrders: any = [];
  openBuyOrders: any = [];

  suggestedBuyOrders: any = []
  suggestedSellOrders: any = []

  botIsRunning = false;

  positionsData = []

  // underlyingToTrade = 'GME'
  sharesOfUnderlyingCurrentlyHeld = 0

  selectTickerLabel = 'Select Ticker'

  possibleTickers = ['GME', 'TDOC', 'Z', 'FATE', 'AMC', 'PLUG', 'NIO', 'PLTR', 'AMZN', 'TWTR', 'GOOG', 'ARKW', 'U', 'TWLO', 'TSLA', 'QQQ', 'BRO', 'TXN', 'WMT', 'UBER'];

  possibleBetSizes = ['1', '2', '3', '5', '10']

  botInterval

  name = 'Angular';

  botThinkingMessage = ''
  cancelledOrdersMessage = ''
  botOrderPlacedMessage = ''
  worstPricePossibleMessage = ''
  waitingMessage = ''

  lastQuotes = {};

  defaultUnderlyingToTrade = 'TWLO'

  underlyingChoice = this.defaultUnderlyingToTrade

  defaultBetSize = '1'

  selectedBetSize = this.defaultBetSize

  selectedAccount: any = null;

  radioData: any;

  accountsData: any;

  currentOrders: any;

  sharesoOfUnderlyingToBuyWorkingOrders: number = 0;
  priceOfUnderlyingToBuyWorkingOrders: number;

  sharesoOfUnderlyingToSellWorkingOrders: number = 0;
  priceOfUnderlyingToSellWorkingOrders: number;

  @ViewChild('undoToast') undoToast;
  @ViewChild('undoi') undi;

  lookingToBuyOrSell: BuyOrSell = BuyOrSell.Waiting;

  lastQuotesForUnderlying = {
    '52WkLow': '--',
    lowPrice: '--',
    lastPrice: '--',
    bidPrice: '--',
    mark: '--',
    askPrice: '--',
    highPrice: '--',
    '52WkHigh': '--'
  }
  prevQuotesForUnderlying = {
    '52WkLow': '--',
    lowPrice: '--',
    lastPrice: '--',
    bidPrice: '--',
    mark: '--',
    askPrice: '--',
    highPrice: '--',
    '52WkHigh': '--'
  }

  limitPriceToPlace: number;
  prevPlacedLimitPrice: number;
  prevPlacedBuyOrSell: BuyOrSell;

  currentUnderlyingDayPlDollars;
  currentUnderlyingDayPlPercentage;

  constructor(private http: HttpClient,
    private tdApiSvc: TdApiService,
    private toastSvc: ToastManagerService,
    private bsModalService: BsModalService,
    private enableGainslockerModalSvc: EnableGainslockerModalService,
    private cancelOrderModalSvc: AskCancelOrderModalService,
    private placeOrderModalSvc: AskPlaceTradeModalService,
  ) { }

  access_token = ''

  title = 'trade-buddy';

  gotTdData = false

  portfolioTotalCash = '-'
  portfolioLongAssetsValue = '-'
  portfolioLongOptionsValue = '-'
  portfolioShortOptionsValue = '-'
  portfolioTotalValue = '-'

  undoClicked(): void {
    console.log('undoing last action...');
  }

  startBotRunning() {
    console.log('starting bot')
    this.botIsRunning = true;
  }

  stopBotRunning() {
    console.log('stopping bot')
    this.botIsRunning = false;

    this.limitPriceToPlace = null;
    this.prevPlacedLimitPrice = null;
    this.prevPlacedBuyOrSell = null;
    this.lookingToBuyOrSell = BuyOrSell.Waiting;
  }

  setUnderlyingSelection(selected) {
    console.log('setting underlying selection! ', selected);
    this.selectTickerLabel = selected
  }

  ngOnInit() {

    this.botInterval = interval(3000)
      .subscribe(async x => {

        this.lookingToBuyOrSell = BuyOrSell.Waiting;

        console.log('3-- getting data!')

        this.accountsData = await this.tdApiSvc.getPositions();

        if (!this.accountsData) {
          this.botThinkingMessage = `Waiting for accounts data to load...`;
        }
        else {
          this.sharesOfUnderlyingCurrentlyHeld = this.tdApiSvc.getSharesOfUnderlyingCurrentlyHeld(this.underlyingChoice, this.accountsData, this.selectedAccount)

          if (this.selectedAccount) {
            console.log('3-- foo ', this.accountsData)
            const { currentUnderlyingDayPlDollars, currentUnderlyingDayPlPercentage } = this.tdApiSvc.getPlForUnderlyingSelected(this.underlyingChoice, this.accountsData, this.selectedAccount)
  
            this.currentUnderlyingDayPlDollars = currentUnderlyingDayPlDollars;
            this.currentUnderlyingDayPlPercentage = currentUnderlyingDayPlPercentage;
        }

          this.currentOrders = await this.tdApiSvc.getWorkingOrders();

          const {
            sharesOfUnderlyingToBuy,
            priceOfUnderlyingToBuy,
            sharesOfUnderlyingToSell,
            priceOfUnderlyingToSell,
          } = this.tdApiSvc.getWorkingOrdersDataForTicker(this.currentOrders, this.selectedAccount, this.underlyingChoice);

          this.sharesoOfUnderlyingToBuyWorkingOrders = sharesOfUnderlyingToBuy
          this.priceOfUnderlyingToBuyWorkingOrders = priceOfUnderlyingToBuy

          this.sharesoOfUnderlyingToSellWorkingOrders = sharesOfUnderlyingToSell
          this.priceOfUnderlyingToSellWorkingOrders = priceOfUnderlyingToSell

          this.lastQuotes = await this.tdApiSvc.getQuotes(this.underlyingChoice);

          console.log('quotes!!', this.lastQuotes)

          if (this.lastQuotes)
            this.lastQuotesForUnderlying = this.lastQuotes[this.underlyingChoice];

          console.log('3-- is bot running? ', this.botIsRunning)

          if (this.botIsRunning) {

            this.lookingToBuyOrSell = decideBuyOrSell(this.sharesOfUnderlyingCurrentlyHeld, +this.selectedBetSize);

            console.log('3-- deciding... ', this.prevPlacedLimitPrice)

            const { limitPriceToPlace, midpoint, worstPossiblePrice } = decideLimitPrice(this.lookingToBuyOrSell, this.lastQuotesForUnderlying.bidPrice, this.lastQuotesForUnderlying.askPrice, this.prevPlacedLimitPrice, this.prevQuotesForUnderlying.bidPrice, this.prevQuotesForUnderlying.askPrice);

            this.limitPriceToPlace = limitPriceToPlace

            this.botThinkingMessage = `Decided to place a ${this.lookingToBuyOrSell} order for ( ${this.selectedBetSize} ) share(s) of ${this.underlyingChoice}  @  $${this.limitPriceToPlace}...`;

            const idsOfOrdersToCancel = this.tdApiSvc.getIdsOfOrdersToCancel(this.currentOrders, this.selectedAccount, this.underlyingChoice);

            console.log('ids of orders to cancel: ', idsOfOrdersToCancel.length, idsOfOrdersToCancel);

            if (this.limitPriceToPlace === this.prevPlacedLimitPrice) {
              console.log('same!')

              this.botOrderPlacedMessage = `NOT Placing a ${this.lookingToBuyOrSell} order for ( ${this.selectedBetSize} ) share(s) of ${this.underlyingChoice}  @  $${this.limitPriceToPlace} - that order is already waiting to be filled... `;
            }
            else {

              const cancelResponse = await this.tdApiSvc.cancelOrders(idsOfOrdersToCancel, this.selectedAccount);
              this.cancelledOrdersMessage = `Cancelled working order(s): ${JSON.stringify(idsOfOrdersToCancel)}.`;
              const placeOrderResponse = await this.tdApiSvc.placeLimitOrder(this.lookingToBuyOrSell, this.underlyingChoice, this.limitPriceToPlace, +this.selectedBetSize, this.selectedAccount)

              this.prevPlacedLimitPrice = this.limitPriceToPlace;
              this.prevPlacedBuyOrSell = this.lookingToBuyOrSell;

              this.prevQuotesForUnderlying = {...this.lastQuotesForUnderlying};

              console.log({ placeOrderResponse });

              this.botOrderPlacedMessage = `Placed ${this.lookingToBuyOrSell} order for ( ${this.selectedBetSize} ) share(s) of ${this.underlyingChoice}  @  $${this.limitPriceToPlace}   🦾 `;
            }

            this.worstPricePossibleMessage = `(Not going ${this.lookingToBuyOrSell === BuyOrSell.Buy ? 'higher' : 'lower'} than the ${this.lookingToBuyOrSell === BuyOrSell.Buy ? 'MIN' : 'MAX'} of the midpoint (${midpoint}) and the midpoint ${this.lookingToBuyOrSell === BuyOrSell.Buy ? '-' : '+'} buffer: (${worstPossiblePrice}))`;

            this.waitingMessage = `Prayin' for a fill, baby... 🙏`

          }
        }
      });
  }

  refreshUserCurrentWorkingOrders() {
    throw new Error("Method not implemented.");
  }

  connectWithAccessTokenClick() {

    console.log('trying to connect with: ', this.access_token)

    this.callForPortfolioValues()

  }

  private callForPortfolioValues() {

  }

  private hideFullStringWithAsertisks(input: string): string {

    return input.substr(0, 1) + '*****' + input.substr(input.length - 3, 3)
  }

  dismissTradeSuggestionClick(order, index) {
    console.log('dismissing trade at index ', index, order)

    let tradeSuggestionObject

    if (order.orderLegCollection[0].instruction === 'BUY') {
      tradeSuggestionObject = this.suggestedBuyOrders.splice(index, 1);
    } else {
      tradeSuggestionObject = this.suggestedSellOrders.splice(index, 1);
    }

    tradeSuggestionObject.oldIndex = index;

    console.log('trade Sugg is: ', tradeSuggestionObject)

    // this.

    this.toastSvc.addToast({
      id: Math.floor(Math.random() * 10000),
      type: 'success',
      msg: `Suggestion dismissed!
        "${order.quantity} shares of ${order.orderLegCollection[0].instrument.symbol} at $${order.price}"`,
      timeout: 30000,
      undo: (toast) => {
        this.toastSvc.toasts.push(toast)
      }
    })

  }

  async placeTradeSuggestionClick(order, index) {

    console.log('placing an order: ', order)

    this.placeOrderModalSvc.confirm(order)
      .subscribe((placeOrderModalResponse) => {

        console.log('returned from place order modal: ', placeOrderModalResponse)

        if (placeOrderModalResponse.answer === 'Cancel') {

          console.log('cancelled from the place order popup... do nothing?')
        } else if (placeOrderModalResponse.answer === 'Place Trade!') {

          console.log('placing trade! ', placeOrderModalResponse)

        } else {
          console.log('unrecognized answer from place order modal... ', placeOrderModalResponse.answer)
        }

      });


  }

  async placeTradeSuggestionConfirmed(order, index) {

    this.toastSvc.addToast(
      {
        id: Math.floor(Math.random() * 10000),
        type: 'success',
        msg: `Trade placed! ${order.quantity} shares of ${order.orderLegCollection[0].instrument.symbol} @ $${order.price} each.`,
        timeout: 5000,
        undo: (toast) => {

          //DOTO - handle undo click

          // this.toastSvc.toasts.push(toast)
        }
      });

    // TODO - place trade!

    let tradeSuggestionObject

    console.log(order.instruction)
    if (order.orderLegCollection[0].instruction === 'BUY') {

      console.log('splicing buys')
      tradeSuggestionObject = this.suggestedBuyOrders.splice(index, 1);
    } else {
      tradeSuggestionObject = this.suggestedSellOrders.splice(index, 1);
    }

    console.log(tradeSuggestionObject)

  }

  enableGainsLockerOnPositionClick(position, index) {
    console.log('enabling gains locker for ', position.instrument.symbol)

    this.enableGainslockerModalSvc.confirm(position)
      .subscribe((enableGainslockModalResponse) => {
        console.log('enableGainslockModalResponse is: ', enableGainslockModalResponse)
        // this.answers.push(answner);
      });
  }

  cancelEnableGainsLockerMode() {
  }

  enableGainsLockerSelectionChange() {
  }

  enableGainsLockerSubmit() {
  }

  onUnderlyingToTradeChange(newUnderlyingToTrade: string) {
    console.log('new unerlying to trade! '), newUnderlyingToTrade;

    console.log('under choice: ', this.underlyingChoice)
  }

}

const asyncIntervals = [];

const runAsyncInterval = async (cb, interval, intervalIndex) => {
  await cb();
  if (asyncIntervals[intervalIndex]) {
    setTimeout(() => runAsyncInterval(cb, interval, intervalIndex), interval);
  }
};

const setAsyncInterval = (cb, interval) => {
  if (cb && typeof cb === "function") {
    const intervalIndex = asyncIntervals.length;
    asyncIntervals.push(true);
    runAsyncInterval(cb, interval, intervalIndex);
    return intervalIndex;
  } else {
    throw new Error('Callback must be a function');
  }
};

const clearAsyncInterval = (intervalIndex) => {
  if (asyncIntervals[intervalIndex]) {
    asyncIntervals[intervalIndex] = false;
  }
};