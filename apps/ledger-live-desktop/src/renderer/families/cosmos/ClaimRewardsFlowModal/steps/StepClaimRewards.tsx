import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ModeSelectorField from "../fields/ModeSelectorField";
import Text from "~/renderer/components/Text";
import DelegationSelectorField from "../fields/DelegationSelectorField";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import {
  CosmosLikeTransaction,
  CosmosMappedDelegation,
} from "@ledgerhq/live-common/families/cosmos/types";

export default function StepClaimRewards({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  warning,
  error,
  t,
}: StepProps) {
  const locale = useSelector(localeSelector);
  invariant(account && account.cosmosResources && transaction, "account and transaction required");
  const bridge = getAccountBridge(account, parentAccount);
  const unit = getAccountUnit(account);
  const updateClaimRewards = useCallback(
    (newTransaction: Partial<CosmosLikeTransaction>) => {
      onUpdateTransaction(transaction => bridge.updateTransaction(transaction, newTransaction));
    },
    [bridge, onUpdateTransaction],
  );
  const onChangeMode = useCallback(
    (mode: string) => {
      updateClaimRewards({
        ...transaction,
        mode: mode as CosmosLikeTransaction["mode"],
      });
    },
    [updateClaimRewards, transaction],
  );
  const selectedValidator = transaction.validators && transaction.validators[0];
  const amount =
    selectedValidator &&
    formatCurrencyUnit(unit, selectedValidator.amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
      locale,
    });
  const onDelegationChange = useCallback(
    ({ validatorAddress, pendingRewards }: CosmosMappedDelegation) => {
      updateClaimRewards({
        ...transaction,
        validators: [
          {
            address: validatorAddress,
            amount: pendingRewards,
          },
        ],
      });
    },
    [updateClaimRewards, transaction],
  );
  const key = transaction.mode === "claimReward" ? "claimInfo" : "compoundInfo";
  return (
    <Box flow={1}>
      <TrackPage
        category="ClaimRewards Flow"
        name="Step 1"
        flow="stake"
        action="claim_rewards"
        currency={account.currency.id}
      />
      {warning && !error ? <ErrorBanner error={warning} warning /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      <ModeSelectorField mode={transaction.mode} onChange={onChangeMode} />
      {amount && (
        <Text fontSize={4} ff="Inter|Medium" textAlign="center">
          <Trans
            i18nKey={`cosmos.claimRewards.flow.steps.claimRewards.${key}`}
            values={{
              amount,
            }}
          >
            <b></b>
          </Trans>
        </Text>
      )}

      <DelegationSelectorField
        transaction={transaction}
        account={account}
        t={t}
        // @ts-expect-error the underlying select can accept null and undefined
        onChange={onDelegationChange}
      />
    </Box>
  );
}
export function StepClaimRewardsFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button disabled={!canNext} primary onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
