<?php

namespace App\Leads\Enums;

enum CallEndReason: string
{
    case AgentRejected = 'agent_rejected';
    case AgentCancelledDuringAnswer = 'agent_cancelled_during_answer';
    case AgentHangup = 'agent_hangup';
    case CallerEndedOrNotAnswered = 'caller_ended_or_not_answered';
    case RingTimeout = 'ring_timeout';
    case NoRecipient = 'no_recipient';
    case TerminateBeforeConnect = 'terminate_before_connect';
    case EndedBeforeConnect = 'ended_before_connect';
    case CompletedUnconfirmedLocally = 'completed_unconfirmed_locally';
    case RemoteTerminated = 'remote_terminated';
    case StaleNoTerminate = 'stale_no_terminate';
    case PreAcceptFailed = 'pre_accept_failed';
    case AcceptFailed = 'accept_failed';
    case AnswerTimeout = 'answer_timeout';
    case MetaFailedAfterConnect = 'meta_failed_after_connect';
    case MetaError = 'meta_error';
    case SdpCacheFailure = 'sdp_cache_failure';
    case AgentCancelledOutbound = 'agent_cancelled_outbound';
    case OutboundConnectFailed = 'outbound_connect_failed';
    case ConsumerDeclinedOutbound = 'consumer_declined_outbound';
    case ConsumerNoAnswerOutbound = 'consumer_no_answer_outbound';

    public function label(): string
    {
        return match ($this) {
            self::AgentRejected => 'Declined',
            self::AgentCancelledDuringAnswer => 'Cancelled while answering',
            self::AgentHangup => 'Ended by us',
            self::CallerEndedOrNotAnswered => 'Caller hung up or nobody answered',
            self::RingTimeout => 'Not answered in time',
            self::NoRecipient => 'No one available to take it',
            self::TerminateBeforeConnect, self::EndedBeforeConnect => 'Ended before it connected',
            self::CompletedUnconfirmedLocally, self::RemoteTerminated => 'Ended',
            self::StaleNoTerminate => 'Ended without confirmation',
            self::PreAcceptFailed, self::AcceptFailed, self::AnswerTimeout, self::SdpCacheFailure => 'Could not be answered',
            self::MetaFailedAfterConnect => 'Connection lost',
            self::MetaError => 'WhatsApp reported a problem',
            self::AgentCancelledOutbound => 'Cancelled before they answered',
            self::OutboundConnectFailed => 'Could not connect',
            self::ConsumerDeclinedOutbound => 'They declined',
            self::ConsumerNoAnswerOutbound => 'Not answered',
        };
    }
}
