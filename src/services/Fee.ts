// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import { config, globals } from '@/config';

interface FeeResult {
  networkFee: string;
  networkFeeAtomic: number;
  devFee: string;
  devFeeAtomic: number;
  nodeFee: string;
  nodeFeeAtomic: number;
  totalFee: string;
  totalFeeAtomic: number;
  remaining: string;
  remainingAtomic: number;
  original: string;
  originalAtomic: number;
}

export function removeFee(amount: number): FeeResult {
  const amountAtomic = toAtomic(amount);

  const [_feeAddress, nodeFeeAtomic] = globals.wallet.getNodeFee();

  const tmp = amountAtomic - config.minimumFee - nodeFeeAtomic;

  /* Ensure it's an integer amount */
  const devFeeAtomic = Math.round(
    tmp - tmp / (1 + config.devFeePercentage / 100),
  );

  const totalFeeAtomic = config.minimumFee + devFeeAtomic + nodeFeeAtomic;

  const remainingAtomic = amountAtomic - totalFeeAtomic;

  return {
    /* The dev fee */
    devFee: fromAtomic(devFeeAtomic),

    devFeeAtomic: devFeeAtomic,

    /* The network fee */
    networkFee: fromAtomic(config.minimumFee),
    networkFeeAtomic: config.minimumFee,

    /* The daemon fee */
    nodeFee: fromAtomic(nodeFeeAtomic),
    nodeFeeAtomic: nodeFeeAtomic,

    /* The original amount */
    original: thousandSeparate(amount),

    originalAtomic: amountAtomic,

    /* The amount to be sent, minus fees */
    remaining: fromAtomic(remainingAtomic),

    remainingAtomic: remainingAtomic,

    /* The sum of the dev and network fee */
    totalFee: fromAtomic(totalFeeAtomic),
    totalFeeAtomic: totalFeeAtomic,
  };
}

export function addFee(amount: number): FeeResult {
  const amountAtomic = toAtomic(amount);

  const [_feeAddress, nodeFeeAtomic] = globals.wallet.getNodeFee();

  /* Add the min fee */
  const tmp = amountAtomic + config.minimumFee;

  /* Get the amount with the dev fee added */
  let devFeeAdded = Math.floor(tmp + (tmp * config.devFeePercentage) / 100);

  devFeeAdded += nodeFeeAtomic;

  const nonAtomic = devFeeAdded / 10 ** config.decimalPlaces;

  /* Then use our previous function to do the rest of the work */
  return removeFee(nonAtomic);
}

/**
 * Converts a human amount to an atomic amount, for use internally
 */
export function toAtomic(amount: number): number {
  return Math.round(amount * 10 ** config.decimalPlaces);
}

/**
 * Converts an atomic amount to a human amount, for display use
 */
export function fromAtomic(amount: number): string {
  const nonAtomic = amount / 10 ** config.decimalPlaces;
  return thousandSeparate(nonAtomic);
}

function thousandSeparate(amount: number): string {
  /* Makes our numbers thousand separated. https://stackoverflow.com/a/2901298/8737306 */
  return amount
    .toFixed(config.decimalPlaces)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
