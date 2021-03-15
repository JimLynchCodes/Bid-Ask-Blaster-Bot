import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockDataSocketService {

  socket = io(environment.tb_central_server_endpoint);

  connectionSuccess = new BehaviorSubject(null)
  // dataForSymbols = new BehaviorSubject(null)
  checkSymbolResponses = new BehaviorSubject(null)
  currentSymbolsToWatch = ''
  lastSymbolChecked: string;
  dataForMyWatchlist$ = new BehaviorSubject(null)

  constructor() {}

  async start() {
    if (!this.socket.connected) {
      this.setupDisconnectListener()
      this.setupNewStockDataListener()
      this.setupCheckSymbolResponseListener()
      // this.removeSymbolFromWatchlistResponseListener()
      await this.setupConnectionListener() 
    }
  }

  // removeSymbolFromWatchlistResponseListener() {

  //   this.socket.on('remove_symbol_from_watchlist_response', (watchlistCsv) => {

  //     localStorage.setItem('watchlist', watchlistCsv)
  //     // console.log('received check symbol response!', data)

  //     // console.log('pushing into checkSymbolResponses...')

  //     // this.checkSymbolResponses.next(data);
  //   });
    
  //   throw new Error("Method not implemented.");
  // }

  private setupConnectionListener() {

    return new Promise(resolve => {
      this.socket.on('connect', () => {
        console.log('connected to server!')
        resolve()
      });
    })
  }

  private setupDisconnectListener() {
    this.socket.on('disconnect', () => {
      console.log('disconnected from server!')
    });
  }

  private setupCheckSymbolResponseListener() {
    this.socket.on('check_symbol_response', (data) => {

      console.log('received check symbol response!', data)

      console.log('pushing into checkSymbolResponses...')

      this.checkSymbolResponses.next(data);
    });
  }

  private setupNewStockDataListener() {
    this.socket.on('new_data_for_watched_symbols', (data) => {
      console.log('received message for new_data_for_watched_symbols!', data)

      console.log('got some of the values: ', Object.values(data))
      this.dataForMyWatchlist$.next(Object.values(data))

      const symbols = Object.keys(data)
      // localStorage.setItem('watchlist', symbols.join(','))

    });
  }

  private setWatchlistToOneRandomSymbol() {

    let newSymbolsCsvString = ['MSFT']

    const rand = Math.floor(Math.random() * 100)

    if (rand < 25)
      newSymbolsCsvString = ['AAPL']
    else if (rand < 35)
      newSymbolsCsvString = ['TSLA']
    else if (rand < 45)
      newSymbolsCsvString = ['MSFT']
    else if (rand < 55)
      newSymbolsCsvString = ['SHW']
    else if (rand < 65)
      newSymbolsCsvString = ['SNAP']
    else if (rand < 75)
      newSymbolsCsvString = ['BOA']
    else if (rand < 85)
      newSymbolsCsvString = ['V']

    this.socket.emit('set_symbols_to_watch', newSymbolsCsvString.join(','))

  }

  checkSymbol(symbol: string): Promise<any> {

    this.lastSymbolChecked = symbol

    return new Promise(resolve => {

      console.log('checking symbol: ', symbol)

      console.log('emitting check_symbol')
      this.socket.emit('check_symbol', symbol);
      this.socket.emit('foo');

      // console.log('size is...', Object.keys(this.socketToWatchlistMap).length)

      // if (Object.keys(this.socketToWatchlistMap).length === 0)
      //   return resolve()

      // console.log('calling out for stock data!')

      // const fullStocksList = this.getFullSetOfStocksCsvString()


      // this.http.get(`https://cloud.iexapis.com/stable/stock/market/batch?symbols=${this.getFullSetOfStocksCsvString()}` +
      // `&types=quote,news,logo&range=1w&last=10&token=${process.env.IEX_PUBLISHABLE}`)
      // .pipe(map(res => res.data))
      // .subscribe(rawData => {

      // this.http.get('' ) {

      //     console.log('got a response for stock data: ', )

      //   })


      // return new Promise(resolve => {

      // const token = 'foo'

      // this.http.get(`https://cloud.iexapis.com/stable/stock/market/batch?symbols=${symbol}` +
      //   `&types=quote,news,logo&range=1w&last=10&token=${token}`)
      //   .pipe(map((res: any) => res.data))
      // })


      // this.http.post<any>(`https://cloud.iexapis.com/stable/stock/market/batch?symbols=${symbol}`, qs.stringify(body), { headers: tokenHeaders }).subscribe(async response => {
      // console.log('got a response... ', response)
      // this.setTokens(response.access_token, response.expires_in, response.refresh_token, response.refresh_token_expires_in);

      // await this.refreshData()
      // resolve()
      // })

      // this.http.get(getOrdersEndpoint, { headers: ordersHeaders }).subscribe((orders: any) => {

      //   console.log('got orderssss: ', orders)

      //   this.orders.next(orders);
      //   resolve()
      // })
      // })

    })
  }

  addToWatchlist(symbol: string) {
    this.socket.emit('add_symbol_to_watchlist', symbol);
  }
  
  removeFromWatchlist(symbol: string) {
    console.log('sending remove_symbol_from_watchlist', symbol)

    const watchlist = localStorage.getItem('watchlist')?.split(',')

    const newWatchlist = watchlist.filter( item => item !== symbol )

    localStorage.setItem('watchlist', newWatchlist.join(','))

    this.socket.emit('remove_symbol_from_watchlist', symbol);
  }

  loadSavedWatchlist() {
    
    const watchlist = localStorage.getItem('watchlist')?.split(',')

    if (watchlist)
      return watchlist

    const defaults = ['MSFT', 'GOOG']
    localStorage.setItem('watchlist', defaults.join(','))

    return defaults
  }


}
