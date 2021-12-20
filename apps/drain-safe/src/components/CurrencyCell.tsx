import { TokenBalance } from '@gnosis.pm/safe-apps-sdk';
import { Icon, Tooltip } from '@gnosis.pm/safe-react-components';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import web3Utils from 'web3-utils';
import Web3 from 'web3';

import { formatCurrencyValue } from '../utils/formatters';
import { tokenToTx } from '../utils/sdk-helpers';
import Flex from './Flex';
import { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk';

function CurrencyCell({
  item,
  currency,
  gasPrice,
  ethFiatPrice,
  web3,
}: {
  item: TokenBalance;
  currency: string;
  gasPrice: BigNumber;
  ethFiatPrice: number;
  web3: Web3 | undefined;
}) {
  const label = formatCurrencyValue(item.fiatBalance, currency);
  const [transferCostInFiat, setTransferCostInFiat] = useState(new BigNumber(0));

  const { safe } = useSafeAppsSDK();

  // Transfer cost estimation
  useEffect(() => {
    const estimateTransferCost = async () => {
      try {
        const sendTokenTx = tokenToTx(safe.safeAddress, item);

        const estimatedTransferGas = await web3?.eth.estimateGas({ ...sendTokenTx, from: safe.safeAddress });

        const gasCostInWei = gasPrice.multipliedBy(estimatedTransferGas || 21000);
        const gasCostInEther = new BigNumber(web3Utils.fromWei(gasCostInWei.toString(), 'ether'));

        const transferCostInFiat = gasCostInEther.multipliedBy(ethFiatPrice);

        setTransferCostInFiat(transferCostInFiat);
      } catch (e) {
        console.log('Error: ', e);
      }
    };
    estimateTransferCost();
  }, [gasPrice, ethFiatPrice, item, web3, safe]);

  // if transfer cost is higher than token market value, we show a warning icon & tooltip in the cell
  const showWarningIcon =
    ethFiatPrice > 0 && gasPrice.toNumber() > 0 && transferCostInFiat.toNumber() >= Number(item.fiatBalance);

  const warningTooltip = `Beware that the cost of this token transfer could be higher than its current market value (Estimated transfer cost: ${formatCurrencyValue(
    transferCostInFiat.toString(),
    currency,
  )})`;

  return showWarningIcon ? (
    <Tooltip title={warningTooltip} placement="top">
      <Flex>
        {label}
        <StyledIcon size="md" type="alert" color="warning" />
      </Flex>
    </Tooltip>
  ) : (
    <Flex>{label}</Flex>
  );
}

export default CurrencyCell;

const StyledIcon = styled(Icon)`
  margin-left: 4px;
`;
