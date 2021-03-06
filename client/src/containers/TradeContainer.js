import React, {Component} from 'react';
import {connect} from 'react-redux';
import {setCurrentTicker} from '../actions/TradeActions';
import {storeTransactionToPortfolio} from '../actions/PortfolioActions';
import Trade from '../components/Trade';
const moment = require('moment');

const mapStateToProps = (state) => {
  return {
    date: state.date.current,
    currentTicker: state.trades.currentTicker,
    currentPrice: state.trades.currentPrice,
    cash: state.portfolio.cash,
    history: state.portfolio.history 
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentTicker: (ticker) => {
      dispatch(setCurrentTicker(ticker));
    },
    storeTransactionToPortfolio: (transaction) => {
      dispatch(storeTransactionToPortfolio(transaction));
    }
  };
};

class TradeContainer extends Component {
  constructor(props) {
    super(props);
    console.log("props in TradeContainer", props);
    this.state = {
      canBuy: 0,
      canSell: 0,
      quantity: 10, 
      buyOrSell: null,
      okToStoreTransaction: true,
      alert: {
        send: false,
        message: "",
        color: ""
      }
    };
  }
  componentDidMount() {
    this.checkCanBuyOrSell();
    this.checkTransaction();
  }
  componentDidUpdate(prevProps) {
    if (
      this.props.currentTicker !== prevProps.currentTicker ||
      this.props.date !== prevProps.date 
    ) {
      console.log("componentDidUpdate - entering validations");
      this.checkCanBuyOrSell();
      this.checkTransaction();
    }
  }

  storeTransaction = (e) => {
    let {quantity, buyOrSell} = this.state;
    let {date, currentTicker, currentPrice, cash} = this.props;
    e.preventDefault();
    this.props.storeTransactionToPortfolio({
      cash: cash - quantity*currentPrice,
      transaction: {
        ticker: currentTicker,
        date: date,
        price: currentPrice,
        quantity: buyOrSell === 'buy' ? quantity : -1*quantity
      }
    });
    //Displays a transaction success message
    this.setState({        
      alert: {
        send: true,
        message: 'Transaction succeeded!',
        color: 'success'
      }
    //And then makes it disappear
    }, () => {
      setTimeout(() => {
        this.setState({alert: {send: false}})
      }, 3000);
    });
  }
  
  // FORM HANDLERS
  // ----------
  onChangeQuantity = (e) => {
    if (!isNaN(e.target.value)){
      this.setState({quantity: +e.target.value}, this.checkTransaction);
    }
  }
  chooseBuy = () => {
    this.setState({buyOrSell: 'buy'}, this.checkTransaction);
  }
  chooseSell = () => {
    this.setState({buyOrSell: 'sell'}, this.checkTransaction);
  }
  
  // ----------
  // FORM VALIDATIONS
  // ----------
  checkCanBuyOrSell() {
    let {date, currentTicker, currentPrice, cash, history,} = this.props;
    let canBuy = 0;
    let canSell = 0;

    if (currentPrice) {
      canBuy = Math.floor(cash / currentPrice);
      console.log("canBuy", canBuy);
    }
    
    const sumOfHoldings = (holdings, transaction) => holdings += transaction.quantity;
    
    if (currentTicker && history[currentTicker]) {
      let holdingsAllOfHistory = history[currentTicker].reduce(sumOfHoldings, 0);
      let holdingsUpToCurrentDate = history[currentTicker]
        .filter(transaction => moment(date).isSameOrAfter(transaction.date))
        .reduce(sumOfHoldings, 0);
      canSell = holdingsAllOfHistory > holdingsUpToCurrentDate ? holdingsAllOfHistory : holdingsUpToCurrentDate;
    }
    
    console.log("canBuy", canBuy);
    console.log("canSell", canSell);
    this.setState({canBuy, canSell}, ()=>console.log("checkCanBuyOrSell has set state", this.state));
  }
  
  checkTransaction = () => {
    let {quantity, canBuy, canSell, buyOrSell} = this.state;
    let okToStoreTransaction = false;
    let alert = {
      send: false,
      message: '',
      color: 'danger'
    };
    
    switch (buyOrSell) {
      case 'buy': {
        if (quantity > canBuy) {
          alert.send = true;
          alert.message = 'You need more cash to buy this stock on this date.';
          okToStoreTransaction = false;
        } else {
          okToStoreTransaction = true;
          alert.send = false;
        }
        console.log("checkTransaction",okToStoreTransaction);
        break;
      }
      case 'sell': {
        if (quantity > canSell) {
          alert.send = true;
          alert.message = 'You need own this stock on this date before you can buy it.';
          okToStoreTransaction = false;
        } else {
          okToStoreTransaction = true;
          alert.send = false;
        }
        break;
      } 
      default: { 
        okToStoreTransaction = false;
        alert.send = false;
        buyOrSell = null;
        break;
      }
    }
    this.setState({okToStoreTransaction, alert}, ()=>console.log("checkTransaction has set state", this.state));
  }
  
  render(){
    console.log("props & state TradeContainer", this.props, this.state);
    console.log("canBuy in render", this.state.canBuy);
    return  (
      <Trade 
        props={this.props}
        state={this.state}
        storeTransaction={this.storeTransaction}
        onChangeQuantity={this.onChangeQuantity}
        chooseBuy={this.chooseBuy}
        chooseSell={this.chooseSell}
      />
    );
  }

}

export default connect(
  mapStateToProps, mapDispatchToProps
)(TradeContainer);

        
  
          
          