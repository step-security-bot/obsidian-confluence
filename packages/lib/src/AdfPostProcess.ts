import { traverse } from "@atlaskit/adf-utils/traverse";
import { JSONDocNode } from "@atlaskit/editor-json-transformer";
import { ConfluenceAdfFile, ConfluenceNode } from "./Publisher";
import { ConfluenceSettings } from "./Settings";

export function prepareAdf(
	confluencePagesToPublish: ConfluenceNode[],
	settings: ConfluenceSettings
) {
	const fileToPageIdMap: Record<string, ConfluenceAdfFile> = {};

	confluencePagesToPublish.forEach((node) => {
		fileToPageIdMap[node.file.fileName] = node.file;
	});

	confluencePagesToPublish.forEach((node) => {
		node.file.contents = traverse(node.file.contents, {
			text: (node, _parent) => {
				if (
					node.marks &&
					node.marks[0].type === "link" &&
					node.marks[0].attrs
				) {
					if (
						typeof node.marks[0].attrs.href === "string" &&
						node.marks[0].attrs.href.startsWith("wikilink")
					) {
						const wikilinkUrl = new URL(node.marks[0].attrs.href);
						const pagename = `${wikilinkUrl.pathname}.md`;

						const linkPage = fileToPageIdMap[pagename];
						if (linkPage) {
							const confluenceUrl = `${settings.confluenceBaseUrl}/wiki/spaces/${linkPage.spaceKey}/pages/${linkPage.pageId}${wikilinkUrl.hash}`;
							node.marks[0].attrs.href = confluenceUrl;
							if (node.text === wikilinkUrl.pathname) {
								node.type = "inlineCard";
								node.attrs = {
									url: node.marks[0].attrs.href,
								};
								delete node.marks;
								delete node.text;
								return node;
							}
						} else {
							delete node.marks[0];
						}
						return node;
					}
				}
			},
		}) as JSONDocNode;
	});
}
