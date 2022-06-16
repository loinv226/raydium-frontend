import { getRewardSignature, hasRewardBeenEdited } from '@/application/createFarm/parseRewardInfo'
import { UIRewardInfo } from '@/application/createFarm/type'
import useCreateFarms from '@/application/createFarm/useCreateFarm'
import CoinAvatar from '@/components/CoinAvatar'
import Icon from '@/components/Icon'
import ListTable from '@/components/ListTable'
import Row from '@/components/Row'
import { toUTC } from '@/functions/date/dateFormat'
import parseDuration, { getDuration, parseDurationAbsolute } from '@/functions/date/parseDuration'
import formatNumber from '@/functions/format/formatNumber'
import { div } from '@/functions/numberish/operations'
import { toString } from '@/functions/numberish/toString'

/**
 * mode: list show
 * mode: list show (item select)
 * mode: edit
 */
export function NewAddedRewardSummary({
  canUserEdit,
  activeReward,
  onActiveRewardChange
}: {
  canUserEdit: boolean

  // --------- when selectable ------------
  activeReward?: UIRewardInfo
  onActiveRewardChange?(reward: UIRewardInfo): void
}) {
  const rewards = useCreateFarms((s) => s.rewards)
  const editableRewards = rewards.filter((r) => r.type === 'existed reward')
  const newReards = rewards.filter((r) => r.type === 'new added')
  return (
    <ListTable
      list={newReards}
      getItemKey={(r) => getRewardSignature(r)}
      labelMapper={[
        {
          label: 'Reward Token',
          cssGridItemWidth: '.6fr'
        },
        {
          label: 'Amount'
        },
        {
          label: 'Total Duration',
          cssGridItemWidth: '.6fr'
        },
        {
          label: 'Period (yy-mm-dd)',
          cssGridItemWidth: '1.5fr'
        },
        {
          label: 'Est. daily rewards'
        }
      ]}
      // className="backdrop-brightness-"
      rowClassName={({ itemData: reward }) => {
        if (canUserEdit) {
          return `${activeReward?.id === reward.id ? 'backdrop-brightness-90' : 'hover:backdrop-brightness-95'}`
        }
        return ''
      }}
      onClickRow={({ itemData: reward }) => {
        onActiveRewardChange?.(reward)
      }}
      renderRowItem={({ item: reward, label }) => {
        if (label === 'Reward Token') {
          return reward.token ? (
            <Row className="gap-1 items-center">
              <CoinAvatar token={reward.token} size="sm" />
              <div>{reward.token?.symbol ?? 'UNKNOWN'}</div>
            </Row>
          ) : (
            '--'
          )
        }

        if (label === 'Amount') {
          if (reward.isRewarding && reward.version === 'v3/v5') return '--'
          return reward.amount ? (
            <div className="break-all">
              {formatNumber(reward.amount, { fractionLength: reward.token?.decimals ?? 6 })}
            </div>
          ) : undefined
        }

        if (label === 'Total Duration') {
          if (reward.isRewarding && reward.version === 'v3/v5') return '--'
          if (!reward.startTime || !reward.endTime) return
          const duration = parseDuration(getDuration(reward.endTime, reward.startTime))
          return duration.hours ? `${duration.days}D ${duration.hours}H` : `${duration.days}D`
        }

        if (label === 'Period (yy-mm-dd)') {
          if (reward.isRewarding && reward.version === 'v3/v5') return '--'
          if (!reward.startTime || !reward.endTime) return
          return (
            <div>
              <div>{toUTC(reward.startTime)}</div>
              <div>{toUTC(reward.endTime)}</div>
            </div>
          )
        }

        if (label === 'Est. daily rewards') {
          if (reward.isRewarding && reward.version === 'v3/v5') return '--'
          const durationTime =
            reward.endTime && reward.startTime ? reward.endTime.getTime() - reward.startTime.getTime() : undefined
          const estimatedValue =
            reward.amount && durationTime ? div(reward.amount, parseDurationAbsolute(durationTime).days) : undefined
          if (!estimatedValue) return
          return (
            <div className="text-xs">
              {toString(estimatedValue)} {reward.token?.symbol}
            </div>
          )
        }
      }}
      renderRowEntry={({ contentNode, destorySelf, itemData }) => {
        const controlsNode = (
          <Row className="gap-2">
            <Icon
              size="smi"
              heroIconName="pencil"
              className="clickable clickable-opacity-effect text-[#abc4ff]"
              onClick={() => {
                onActiveRewardChange?.(itemData)
              }}
            />
            <Icon
              size="smi"
              heroIconName="trash"
              className={`clickable text-[#abc4ff] ${rewards.length > 1 ? 'hover:text-[#DA2EEF]' : 'hidden'}`}
              onClick={() => rewards.length > 1 && destorySelf()} // delete is wrong
            />
          </Row>
        )

        return (
          <>
            {contentNode}
            {canUserEdit && (
              <div className="absolute -right-10 top-1/2 -translate-y-1/2 translate-x-full">{controlsNode}</div>
            )}
          </>
        )
      }}
      onListChange={(newRewards) => {
        useCreateFarms.setState({
          rewards: editableRewards.concat(newRewards)
        })
      }}
    />
  )
}