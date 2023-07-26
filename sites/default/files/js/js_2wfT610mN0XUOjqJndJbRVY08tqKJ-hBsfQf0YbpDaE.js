/* @license GNU-GPL-2.0-or-later https://www.drupal.org/licensing/faq */
(function($,Drupal,drupalSettings,storage){const currentUserID=parseInt(drupalSettings.user.uid,10);const secondsIn30Days=2592000;const thirtyDaysAgo=Math.round(new Date().getTime()/1000)-secondsIn30Days;let embeddedLastReadTimestamps=false;if(drupalSettings.history&&drupalSettings.history.lastReadTimestamps)embeddedLastReadTimestamps=drupalSettings.history.lastReadTimestamps;Drupal.history={fetchTimestamps(nodeIDs,callback){if(embeddedLastReadTimestamps){callback();return;}$.ajax({url:Drupal.url('history/get_node_read_timestamps'),type:'POST',data:{'node_ids[]':nodeIDs},dataType:'json',success(results){Object.keys(results||{}).forEach((nodeID)=>{storage.setItem(`Drupal.history.${currentUserID}.${nodeID}`,results[nodeID]);});callback();}});},getLastRead(nodeID){if(embeddedLastReadTimestamps&&embeddedLastReadTimestamps[nodeID])return parseInt(embeddedLastReadTimestamps[nodeID],10);return parseInt(storage.getItem(`Drupal.history.${currentUserID}.${nodeID}`)||0,10);},markAsRead(nodeID){$.ajax({url:Drupal.url(`history/${nodeID}/read`),type:'POST',dataType:'json',success(timestamp){if(embeddedLastReadTimestamps&&embeddedLastReadTimestamps[nodeID])return;storage.setItem(`Drupal.history.${currentUserID}.${nodeID}`,timestamp);}});},needsServerCheck(nodeID,contentTimestamp){if(contentTimestamp<thirtyDaysAgo)return false;if(embeddedLastReadTimestamps&&embeddedLastReadTimestamps[nodeID])return (contentTimestamp>parseInt(embeddedLastReadTimestamps[nodeID],10));const minLastReadTimestamp=parseInt(storage.getItem(`Drupal.history.${currentUserID}.${nodeID}`)||0,10);return contentTimestamp>minLastReadTimestamp;}};})(jQuery,Drupal,drupalSettings,window.localStorage);;
(function($,Drupal,drupalSettings){function hide($placeholder){return ($placeholder.closest('.comment-new-comments').prev().addClass('last').end().hide());}function remove($placeholder){hide($placeholder).remove();}function show($placeholder){return ($placeholder.closest('.comment-new-comments').prev().removeClass('last').end().show());}function processNodeNewCommentLinks(placeholders){const $placeholdersToUpdate={};let fieldName='comment';let $placeholder;placeholders.forEach((placeholder)=>{$placeholder=$(placeholder);const timestamp=parseInt($placeholder.attr('data-history-node-last-comment-timestamp'),10);fieldName=$placeholder.attr('data-history-node-field-name');const nodeID=$placeholder.closest('[data-history-node-id]').attr('data-history-node-id');const lastViewTimestamp=Drupal.history.getLastRead(nodeID);if(timestamp>lastViewTimestamp)$placeholdersToUpdate[nodeID]=$placeholder;else remove($placeholder);});const nodeIDs=Object.keys($placeholdersToUpdate);if(nodeIDs.length===0)return;function render(results){Object.keys(results||{}).forEach((nodeID)=>{if($placeholdersToUpdate.hasOwnProperty(nodeID)){const $placeholderItem=$placeholdersToUpdate[nodeID];const result=results[nodeID];$placeholderItem[0].textContent=Drupal.formatPlural(result.new_comment_count,'1 new comment','@count new comments');$placeholderItem.attr('href',result.first_new_comment_link).removeClass('hidden');show($placeholderItem);}});}if(drupalSettings.comment&&drupalSettings.comment.newCommentsLinks)render(drupalSettings.comment.newCommentsLinks.node[fieldName]);else $.ajax({url:Drupal.url('comments/render_new_comments_node_links'),type:'POST',data:{'node_ids[]':nodeIDs,field_name:fieldName},dataType:'json',success:render});}Drupal.behaviors.nodeNewCommentsLink={attach(context){const nodeIDs=[];const placeholders=once('history','[data-history-node-last-comment-timestamp]',context).filter((placeholder)=>{const $placeholder=$(placeholder);const lastCommentTimestamp=parseInt($placeholder.attr('data-history-node-last-comment-timestamp'),10);const nodeID=$placeholder.closest('[data-history-node-id]').attr('data-history-node-id');if(Drupal.history.needsServerCheck(nodeID,lastCommentTimestamp)){nodeIDs.push(nodeID);hide($placeholder);return true;}remove($placeholder);return false;});if(placeholders.length===0)return;Drupal.history.fetchTimestamps(nodeIDs,()=>{processNodeNewCommentLinks(placeholders);});}};})(jQuery,Drupal,drupalSettings);;
