
import { Component, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertComponent } from 'ngx-bootstrap/alert/alert.component';
import { Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';
import { ServerCallerService } from '../../good-services/central-server-caller/central-server-caller.service'
import { StockDataSocketService } from '../../services/stock-data-socket/stock-data-socket.service';
import { ThrowStmt } from '@angular/compiler';

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
  }
  ]

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
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsPageComponent {

  accountNumber: string;
  currentEquityPositions: any[];
  currentOrders: any;

  suggestedBuyOrders: any = [fakeBuyOrder2, fakeBuyOrder3]
  suggestedSellOrders: any = []

  symbolToCheck = ''

  checkSymbolResponses = new BehaviorSubject(null)

  @ViewChild('undoToast') undoToast;
  @ViewChild('undoi') undi;

  newTitle: string;
  @ViewChild('input') input;
  symbolCheckSuccessData: any;
  symbolCheck404ed: string;

  constructor(private http: HttpClient,
    private serverCaller: ServerCallerService,
    public stockDataSocketSvc: StockDataSocketService,
  ) { }

  title = 'trade-buddy';
  connectedToText = '[No account connected]';

  callingForData = false

  symbolToAdd = ''

  currentCash = '$10,234'

  portfolioTotalCash = '-'
  portfolioLongAssetsValue = '-'
  portfolioLongOptionsValue = '-'
  portfolioShortOptionsValue = '-'
  portfolioTotalValue = '-'

  alerts: any[] = [{
    type: 'success',
    msg: `Well done! You successfully read this important alert message. (added: ${new Date().toLocaleTimeString()})`,
    timeout: 5000
  }];

  toasts: any = [{
    type: 'success',
    msg: `Trade placed! 10 shares of MSFT @ $15.04 each.`,
    timeout: 5000
  }]

  add(): void {
    this.alerts.push({
      type: 'success',
      msg: `Trade placed! 10 shares of MSFT @ $15.04 each.`,
      dismissible: true,
      timeout: 5000,
    });
  }

  undoClicked(): void {
    console.log('undoing last action...');
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter(alert => alert !== dismissedAlert);
  }

  ngOnInit() {
    console.log('init settings');

    this.suggestedBuyOrders.push(fakeBuyOrder1)
    this.suggestedBuyOrders.push(fakeBuyOrder1)
    this.suggestedBuyOrders.push(fakeBuyOrder1)
    this.suggestedSellOrders.push(fakeSellOrder1)

    const minTime = 10200

    this.stockDataSocketSvc.checkSymbolResponses.subscribe(result => {

      console.log('got a check symbol response in settings component', result)

      if (result) {
        this.checkSymbolResponses.next(result)

        console.log('this.stockDataSocketSvc.lastSymbolChecked ', this.stockDataSocketSvc.lastSymbolChecked)
        console.log('result[this.stockDataSocketSvc.lastSymbolChecked] ', result[this.stockDataSocketSvc.lastSymbolChecked])
        console.log('result[`$this.stockDataSocketSvc.lastSymbolChecked)`]) ', result[`${this.stockDataSocketSvc.lastSymbolChecked.toUpperCase()}`])

        if (result[`${this.stockDataSocketSvc.lastSymbolChecked.toUpperCase()}`]) {

          const data = result[`${this.stockDataSocketSvc.lastSymbolChecked.toUpperCase()}`]

          console.log('nice, display this logo: ', data.logo)

          this.symbolCheckSuccessData = data
          this.symbolCheck404ed = null
        }
        else {
          this.symbolCheck404ed = this.stockDataSocketSvc.lastSymbolChecked
          this.symbolCheckSuccessData = null
          console.log('false, show error')
        }

      }
    })

    setInterval(() => {
      if (this.suggestedBuyOrders.length < 10)
        this.suggestedBuyOrders.push(fakeBuyOrder1)
    }, minTime)

    setInterval(() => {
      if (this.suggestedBuyOrders.length < 10)
        this.toasts.push()
    }, 5000)

  }

  subscription: Subscription;
  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }

  async ngAfterViewInit() {
    console.log('toast ', this.undoToast)
    console.log('toast ', this.undi)

    await this.stockDataSocketSvc.start()

    this.subscription = this.input.valueChanges.pipe(
      skip(1), // skip initial value
      distinctUntilChanged(),
      debounceTime(1000)
    ).subscribe(async (value) => {

      console.log('CHECKING SYMBOL')
      // this.rename(value)

      // this.serverCaller.checkSymbol(value);
      // this.socketServerSvc.checkSymbol(value);
      console.log('thing value ', value)

  
      this.callingForData = true
      
      const result = await this.stockDataSocketSvc.checkSymbol(value);
      
      this.callingForData = false

      console.log('thing now: ', this.callingForData)
    });

  }

  // rename(value): void {



  //   // this.renameRequest.emit(value);

  // }

  private hideFullStringWithAsertisks(input: string): string {

    return input.substr(0, 1) + '*****' + input.substr(input.length - 3, 3)
  }

  dismissTradeSuggestionClick(order, index) {
    console.log('dismissing trade at index ', index)

    let tradeSuggestionObject

    if (order.orderLegCollection[0].instruction === 'BUY') {
      tradeSuggestionObject = this.suggestedBuyOrders.splice(index, 1);
    } else {
      tradeSuggestionObject = this.suggestedSellOrders.splice(index, 1);
    }

    console.log('trade Sugg is: ', tradeSuggestionObject)
  }

  placeTradeSuggestionClick(order, index) {

    console.log(`sending a ${order.instruction} trade for ${order.quantity} shared of ${order.symbol}`)

    this.toasts.push({
      type: 'success',
      msg: `Trade placed! ${order.quantity} shares of ${order.orderLegCollection[0].instrument.symbol} @ $${order.price} each.`,
      dismissible: true,
      timeout: 5000,
    });

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

  addToWatchlistClicked(quoteData: any) {
    console.log('adding to watchlist: ', quoteData.symbol)
    this.stockDataSocketSvc.addToWatchlist(quoteData.symbol)
  
    this.symbolToCheck = ''

  }

  removeFromWatchlistClicked(quoteData: any) {
    console.log('adding to watchlist: ', quoteData.symbol)
    this.stockDataSocketSvc.removeFromWatchlist(quoteData.symbol)
  }


}
