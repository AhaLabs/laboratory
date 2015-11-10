import React from 'react';
import _ from 'lodash';
import {Account} from 'stellar-sdk';

export let AddressParameter = React.createClass({
  getInitialState: function() {
    let state = {value: '', error: null, hidden: false};
    if (_.contains(['selling_asset_issuer', 'buying_asset_issuer', 'destination_asset_issuer'], this.props.param)) {
      state.hidden = true;
    }
    return state;
  },
  onChange: function(event) {
    let value = event.target.value;
    let error = null;
    if (value && !Account.isValidAddress(value)) {
      error = 'Address is invalid.';
    }

    this.setState({value, error});
    this.props.onUpdate(this.props.param, value, error);
  },
  onParameterChange({key, value}) {
    if ((this.props.param === 'selling_asset_issuer' && key === 'selling_asset_type') ||
        (this.props.param === 'buying_asset_issuer' && key === 'buying_asset_type') ||
        (this.props.param === 'destination_asset_issuer' && key === 'destination_asset_type')) {
      let hidden = value === 'native';
      this.setState(_.extend(this.state, {hidden}));
    }
  },
  onExternalError: function({param, error}) {
    if (param === this.props.param && !this.state.error) {
      this.setState(_.extend(this.state, {error}));
    }
  },
  componentDidMount: function() {
    this.props.addParameterChangeListener(this.onParameterChange);
    this.props.addParameterErrorListener(this.onExternalError);
  },
  componentWillUnmount: function() {
    this.props.removeParameterChangeListener(this.onParameterChange);
    this.props.removeParameterErrorListener(this.onExternalError);
  },
  render: function() {
    let {value, error, hidden} = this.state;
    let {optional} = this.props;
    let text;
    switch (this.props.param) {
      case 'source_account':
        text = 'Source Account';
        break;
      case 'destination_account':
        text = 'Destination Account';
        break;
      case 'destination_asset_issuer':
        text = 'Destination Asset Issuer';
        break;
      case 'selling_asset_issuer':
        text = 'Selling Asset Issuer';
        break;
      case 'buying_asset_issuer':
        text = 'Buying Asset Issuer';
        break;
      default:
        text = 'Account ID';
    }
    return hidden ?
      null
      :
      <div className="optionsTable__pair">
        <div className="optionsTable__pair__title">
          {text}
          {optional && <span className="optionsTable__pair__title__optional"> (optional)</span>}
        </div>
        <div className="optionsTable__pair__content">
          <input type="text" value={value} onChange={this.onChange}/>
          {error ? <p className="optionsTable__pair__content__alert">
            {error}
          </p> : ''}
        </div>
      </div>;
  }
});
