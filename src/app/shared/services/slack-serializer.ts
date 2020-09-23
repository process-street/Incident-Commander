
// Import the core angular services.
import { Injectable } from "@angular/core";

// Import the application services.
import { Incident } from "./incident.service";
import { Timezone } from "./timezones";

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

var WEEKDAYS = [ "Sun", "Mon", "Tue", "Wed", "Thr", "Fri", "Sat" ];
var MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

@Injectable({
	providedIn: "root"
})
export class SlackSerializer {

	// I serialize the given incident for use in a Slack message.
	public serializeMarkdown(
		incident: Incident,
		updateLimit: number,
		format: string,
		timezone: Timezone
		) : string {

		var parts = [];
		parts.push( `*User Impact*: ${ incident.description }` );

		if ( incident.version === "general" ) {

			parts.push( `*Priority*: ${ incident.priority.id }` );

		} else {

			if ( incident.zendeskTicket ) {

				incident.zendeskTicket.includes( "/" )
					? parts.push( `*Zendesk Ticket*: \`${ incident.zendeskTicket }\`` )
					: parts.push( `*Zendesk Ticket*: \`https://invisionapp.zendesk.com/agent/tickets/${ incident.zendeskTicket }\``)
				;

			}

			parts.push( `*Customer Type*: ${ incident.customerType || "_Unknown_" }` );
			parts.push( `*Customer Count*: ${ incident.customerCount || "_Unknown_" }` );

		}

		parts.push( `*Start of Impact*: ${ this.formatTime( incident.startedAt, timezone ) } on ${ this.formatDate( incident.startedAt, timezone ) }` );
		parts.push( `*Zoom Link*: ${ incident.videoLink } ` );
		parts.push( `*Status*: ${ incident.status.id }` );

		if ( incident.version === "invision" ) {

			incident.internalTeam
				? parts.push( `*Team Writing RCA*: ${ incident.internalTeam }` )
				: parts.push( `*Team Writing RCA*: _The team responsible for writing the RCA is not yet clear._` )
			;

		}

		parts.push( `*Timeline*: \`https://www.incident-commander.com/#${ incident.id }\` ` );

		var visibleUpdates = incident.updates.slice( -updateLimit );

		// If there are updates to show, add a spacer between the heads-up data and the
		// actual timeline items.
		if ( visibleUpdates.length ) {

			parts.push( "" );

		}

		// If not all updates are visible, add an indication as to how many are hidden.
		if ( visibleUpdates.length !== incident.updates.length ) {

			var hiddenCount = ( incident.updates.length - visibleUpdates.length );

			parts.push( `> _.... *${ hiddenCount } update(s)* not being shown._` );
			parts.push( "> " );

		}

		// Render visible updates.
		for ( var i = 0 ; i < visibleUpdates.length ; i++ ) {

			// Only add a line-delimiter if the format is readable.
			if ( ( format === "readable" ) && ( i !== 0 ) ) {

				parts.push( "> " );

			}

			var update = visibleUpdates[ i ];
			var segment = `*${ this.formatTime( update.createdAt, timezone ) } [ ${ update.status.id } ]*: \u2014 ${ update.description }`;

			// Since there may be hard line-breaks within each Slack message, we need
			// to make sure to add the quote character (">") to every start-of-line, 
			// otherwise the message will wrap incorrectly.
			parts.push( segment.replace( /^/gm, "> " ) );

		}

		return( parts.join( "\n" ) );

	}

	// I serialize the given incident for use in a rich text Slack message.
	public serializeHTML(
		incident: Incident,
		updateLimit: number,
		format: string,
		timezone: Timezone
	) : string {

		var parts = [];
		parts.push( `<strong>User Impact</strong>: ${ incident.description }` );

		// if ( incident.version === "general" ) {
		//
			parts.push( `<strong>Priority</strong>: ${ incident.priority.id }` );
		//
		// } else {
		//
		// 	if ( incident.zendeskTicket ) {
		//
		// 		incident.zendeskTicket.includes( "/" )
		// 			? parts.push( `*Zendesk Ticket*: \`${ incident.zendeskTicket }\`` )
		// 			: parts.push( `*Zendesk Ticket*: \`https://invisionapp.zendesk.com/agent/tickets/${ incident.zendeskTicket }\``)
		// 		;
		//
		// 	}
		//
		// 	parts.push( `*Customer Type*: ${ incident.customerType || "_Unknown_" }` );
		// 	parts.push( `*Customer Count*: ${ incident.customerCount || "_Unknown_" }` );
		//
		// }

		parts.push( `<strong>Start of Impact</strong>: ${ this.formatTime( incident.startedAt, timezone ) } on ${ this.formatDate( incident.startedAt, timezone ) }` );
		parts.push( `<strong>Zoom Link</strong>: ${ incident.videoLink } ` );
		parts.push( `<strong>Status</strong>: ${ incident.status.id }` );

		// if ( incident.version === "invision" ) {
		//
		// 	incident.internalTeam
		// 		? parts.push( `*Team Writing RCA*: ${ incident.internalTeam }` )
		// 		: parts.push( `*Team Writing RCA*: _The team responsible for writing the RCA is not yet clear._` )
		// 	;
		//
		// }

		parts.push( `<strong>Timeline</strong>: https://localhost:4200/#${ incident.id } ` );

		var visibleUpdates = incident.updates.slice( -updateLimit );

		var blockParts = [];
		// If there are updates to show, add a spacer between the heads-up data and the
		// actual timeline items.
		if ( visibleUpdates.length ) {

			parts.push( "" );

		}

		// If not all updates are visible, add an indication as to how many are hidden.
		if ( visibleUpdates.length !== incident.updates.length ) {

			var hiddenCount = ( incident.updates.length - visibleUpdates.length );

			blockParts.push( `<em>.... <strong>${ hiddenCount } update(s)</strong> not being shown.</em>` );
			blockParts.push( "" );

		}

		// Render visible updates.
		for ( var i = 0 ; i < visibleUpdates.length ; i++ ) {

			// Only add a line-delimiter if the format is readable.
			if ( ( format === "readable" ) && ( i !== 0 ) ) {

				blockParts.push( "" );

			}

			var update = visibleUpdates[ i ];
			var segment = `<strong>${ this.formatTime( update.createdAt, timezone ) } [ ${ update.status.id } ]</strong>: \u2014 ${ update.description }`;

			blockParts.push (segment );

		}

		if ( blockParts.length ) {

			parts.push( `<blockquote>${ blockParts.join("<br/>") }</blockquote>` );

		}

		return( parts.join( "<br/>" ) );

	}


	// ---
	// PRIVATE METHODS.
	// ---


	// I format the given Date object as a date string in EST / EDT timezone.
	private formatDate( value: Date, timezone: Timezone ) : string {

		var slackDate = this.getDateInTimezone( value, timezone );

		var normalizedWeekday = WEEKDAYS[ slackDate.getDay() ];
		var normalizedMonth = MONTHS[ slackDate.getMonth() ];
		
		return( `${ normalizedWeekday }, ${ normalizedMonth } ${ slackDate.getDate() }, ${ slackDate.getFullYear() }` );

	}


	// I format the given Date object as a time string in the EST / EDT timezone.
	private formatTime( value: Date, timezone: Timezone ) : string {

		var slackDate = this.getDateInTimezone( value, timezone );
		
		var hours = slackDate.getHours();
		var minutes = slackDate.getMinutes();
		var period = ( hours < 12 )
			? "AM"
			: "PM"
		;

		var normalizedHours = ( ( hours % 12 ) || 12 );
		var normalizedMinutes = ( "0" + minutes ).slice( -2 );

		return( `${ normalizedHours }:${ normalizedMinutes } ${ period } ${ timezone.abbreviation }` );

	}


	// I return the given local date adjusted for the given timezone.
	private getDateInTimezone( value: Date, timezone: Timezone ) : Date {

		// In order to [try our best to] convert from the local timezone to the Slack
		// timezone for rendering, we're going to use the difference in offset minutes
		// to alter a local copy of the Date object.
		var offsetDelta = ( timezone.offset - value.getTimezoneOffset() );

		// Clone the date so we don't mess up the original value as we adjust it.
		var adjustedDate = new Date( value );

		// Attempt to move from the current TZ to the given TZ by adjusting minutes.
		adjustedDate.setMinutes( adjustedDate.getMinutes() - offsetDelta );

		return( adjustedDate );

	}

}
